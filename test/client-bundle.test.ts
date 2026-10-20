/**
 * The built browser bundle, loaded the way the DSH Web shell loads it.
 *
 * This is the contract test for the client half: it runs `lib/client.js` in a
 * fresh VM context with a stub `window.__ModuleLoader__`, hands the factory the
 * same two seeded modules the shell seeds, and then mounts the result against
 * a stub client context. It fails if the banner, the id, the export shape, the
 * slot registration or the host check-in ever drift.
 *
 * It needs `lib/client.js` to exist, so it runs after a build (`pnpm verify`
 * builds first); without one it skips rather than reporting a false failure.
 */
import { existsSync, readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { fileURLToPath } from 'node:url'

import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { platformTranslator } from './stubs/locale.ts'

const BUNDLE = fileURLToPath(new URL('../lib/client.js', import.meta.url))

/** The dictionaries the bundle registered, captured across loads. */
const captured = new Map<string, Record<string, Record<string, unknown>>>()

/** The locale namespace -> dictionaries the last `apply` registered. */
function capturedDictionaries(): Record<string, Record<string, unknown>> {
  return captured.get('autofillModelMetadata') ?? {}
}

/** One definition handed to `window.__ModuleLoader__.load`. */
interface BundleDefinition {
  id: string
  factory: (require: (specifier: string) => unknown) => Record<string, unknown>
}

/** The client plugin shape the bundle is expected to export. */
interface ClientPlugin {
  name: string
  inject: string[]
  apply: (ctx: unknown) => void
}

/** What one load of the bundle observed. */
interface Loaded {
  source: string
  id: string
  plugin: ClientPlugin
  calls: Array<{ url: string; init?: RequestInit }>
}

/**
 * The modules the shell's static seed resolves for this bundle.
 *
 * There are exactly two: React and the JSX runtime. The page renders its own
 * controls on purpose, so a `require` for any Harness Client package would be a
 * regression and throws here.
 */
function seeded(specifier: string): unknown {
  switch (specifier) {
    case 'react':
      return React
    case 'react/jsx-runtime':
      return jsxRuntime
    default:
      throw new Error(`the bundle required an unseeded module: ${specifier}`)
  }
}

/** Run the bundle in a VM context with a stub module loader. */
function load(): Loaded {
  const source = readFileSync(BUNDLE, 'utf8')
  const definitions: BundleDefinition[] = []
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const fetchStub = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return { ok: true, status: 200, json: async () => ({ ok: true }) }
  })
  const sandbox = {
    window: { __ModuleLoader__: { load: (definition: BundleDefinition) => definitions.push(definition) } },
    fetch: fetchStub,
    console,
    setTimeout,
    clearTimeout,
  }
  runInContext(source, createContext(sandbox))

  if (definitions.length !== 1) throw new Error(`expected one bundle definition, saw ${definitions.length}`)
  const [definition] = definitions
  const plugin = definition.factory(seeded) as unknown as ClientPlugin
  return { source, id: definition.id, plugin, calls }
}

describe('the built client bundle', () => {
  let loaded: Loaded

  beforeAll(() => {
    if (!existsSync(BUNDLE)) return
    loaded = load()
  })

  it('wraps itself in the loader contract with the package name as its id', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    expect(loaded.source).toContain('window.__ModuleLoader__.load(')
    expect(loaded.source).toContain('id: "dsh-autofill-model-metadata"')
    expect(loaded.source.trimEnd().endsWith('});')).toBe(true)
    expect(loaded.id).toBe('dsh-autofill-model-metadata')
  })

  it('exports the cordis plugin shape, requiring only seeded modules', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    expect(loaded.plugin.name).toBe('dsh-autofill-model-metadata')
    expect(loaded.plugin.inject).toEqual(['slots', 'locale'])
    expect(typeof loaded.plugin.apply).toBe('function')
    // Every require the bundle makes is one `seeded()` answers, so a missing
    // module would have thrown inside the factory above.
    expect(loaded.source).toContain('require("react/jsx-runtime")')
  })

  it('bundles no React of its own', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    // A second React would break hooks in the shell; the loader provides the one
    // real copy, so the bundle must only reference it.
    expect(loaded.source).not.toContain('__SECRET_INTERNALS')
    expect(loaded.source).not.toContain('react.production')
    expect(loaded.source).toMatch(/require\("react"\)/)
  })

  it('registers one Settings navigation row and reports in to the host', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    const registrations: Array<{ slot: string; options: Record<string, unknown>; component: unknown }> = []
    const ctx = {
      effect: (callback: () => void | (() => void)) => {
        callback()
      },
      locale: {
        register: vi.fn(),
        // A translator that echoes keys back: the page must still read as copy.
        bind: () => (key: string) => key,
      },
      slots: {
        inject: (slot: string, callback: () => unknown) => callback(),
        register: (options: Record<string, unknown>, component: unknown) => {
          registrations.push({ slot: 'settings.section', options, component })
          return () => undefined
        },
      },
      logger: { warn: vi.fn(), info: vi.fn() },
    }

    loaded.plugin.apply(ctx)

    expect(registrations).toHaveLength(1)
    expect(registrations[0].options).toMatchObject({
      name: 'settings.section',
      id: 'autofill-model-metadata',
      order: 100,
      locale: 'autofillModelMetadata',
    })
    // The label is a thunk, and it resolves to real copy even when the bound
    // translator only echoes keys.
    const label = registrations[0].options.label as () => string
    expect(typeof label()).toBe('string')
    expect(label()).toBe('模型元数据')

    const dictionaries = (ctx.locale.register as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(dictionaries?.[0]).toBe('autofillModelMetadata')
    expect(Object.keys(dictionaries?.[1] as object)).toEqual(['zh', 'en'])

    const live = loaded.calls.find((call) => call.url.endsWith('/page-live'))
    expect(live?.init?.method).toBe('POST')
    expect(live?.url).toBe('/api/dsh-autofill-model-metadata/page-live')
  })

  it('renders through the host translator with the real dictionaries', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    const dictionaries = loaded.calls.length >= 0 ? capturedDictionaries() : undefined
    const bound = platformTranslator(dictionaries ?? {}, 'zh')
    let component: unknown
    const ctx = {
      effect: (callback: () => void | (() => void)) => callback(),
      locale: {
        register: (ns: string, dicts: Record<string, unknown>) => {
          captured.set(ns, dicts as Record<string, Record<string, unknown>>)
        },
        bind: (ns: string) => bound(ns),
      },
      slots: {
        inject: (_slot: string, callback: () => unknown) => callback(),
        register: (_options: Record<string, unknown>, registered: unknown) => {
          component = registered
          return () => undefined
        },
      },
    }
    loaded.plugin.apply(ctx)

    const html = renderToStaticMarkup(
      React.createElement(component as never, { t: bound('autofillModelMetadata') }),
    )
    // A dictionary entry the platform cannot read would throw inside `translate`
    // (it calls `.replace` on the resolved value) and this render would fail.
    // These are the parameterised lines the first paint always shows.
    expect(html).toContain('0/0 个模型已映射')
    expect(html).toContain('加载中…')
    // Nothing may reach the DOM with a placeholder still in it.
    expect(html).not.toMatch(/\{\w+\}/)
  })

  it('renders the registered component through the seeded React', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    let component: unknown
    const ctx = {
      effect: (callback: () => void | (() => void)) => callback(),
      locale: { register: vi.fn(), bind: () => undefined },
      slots: {
        inject: (_slot: string, callback: () => unknown) => callback(),
        register: (_options: Record<string, unknown>, registered: unknown) => {
          component = registered
          return () => undefined
        },
      },
    }
    loaded.plugin.apply(ctx)
    expect(typeof component).toBe('function')

    // No props: the page must render from its built-in copy alone. Effects do
    // not run during a static render, so this is the page's first paint.
    const html = renderToStaticMarkup(React.createElement(component as never))
    expect(html).toContain('模型元数据补齐')
    expect(html).toContain('加载中…')
  })

  it('tears its locale dictionaries down with the plugin, so a reload can re-register them', () => {
    if (loaded === undefined) return expect(BUNDLE).toBe('built')
    // Registering the same (namespace, locale) twice throws. A hot reload
    // disposes the old entry and applies the new bundle in the same page, so the
    // effect must hand its disposer back: without it the dictionaries outlive
    // their plugin and the second apply throws, silently dropping the settings
    // entry until the whole page is reloaded.
    const registered = new Map<string, Set<string>>()
    const disposers: Array<() => void> = []
    const ctx = {
      effect: (callback: () => void | (() => void)) => {
        const dispose = callback()
        if (typeof dispose === 'function') disposers.push(dispose)
      },
      locale: {
        register: (ns: string, dicts: Record<string, unknown>) => {
          const locales = registered.get(ns) ?? new Set<string>()
          registered.set(ns, locales)
          for (const locale of Object.keys(dicts)) {
            if (locales.has(locale)) throw new Error(`locale namespace "${ns}" already has locale "${locale}"`)
            locales.add(locale)
          }
          return () => {
            for (const locale of Object.keys(dicts)) locales.delete(locale)
          }
        },
        bind: () => undefined,
      },
      slots: {
        inject: (_slot: string, callback: () => unknown) => callback(),
        register: () => () => undefined,
      },
    }

    loaded.plugin.apply(ctx)
    // The locale effect must hand back the service's disposer; without one the
    // registration outlives the plugin entry. (The duplicate-registration guard
    // below keeps the page alive, so the throw alone cannot prove this.)
    expect(disposers.length).toBeGreaterThan(0)
    // What the hot-reload queue does before importing the rebuilt bundle.
    for (const dispose of [...disposers]) dispose()
    expect(() => loaded.plugin.apply(ctx)).not.toThrow()
    expect([...(registered.get('autofillModelMetadata') ?? [])].sort()).toEqual(['en', 'zh'])
  })

})
