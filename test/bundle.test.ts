/**
 * Bundle contract: what the host actually loads.
 *
 * `lib/index.mjs` is the artifact `cordis.patch.yml` mounts, so its export
 * shape — and the fact that it leaves `cordis` and `schemastery` to the host —
 * is worth asserting directly rather than only through the sources.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

const bundlePath = resolve(process.cwd(), 'lib/index.mjs')
const describeBundle = existsSync(bundlePath) ? describe : describe.skip
const bundle = existsSync(bundlePath) ? readFileSync(bundlePath, 'utf8') : ''
const mod = (existsSync(bundlePath) ? await import(pathToFileURL(bundlePath).href) : undefined) as
  | Record<string, unknown>
  | undefined

describeBundle('built bundle', () => {
  it('exports exactly the plugin contract the loader expects', () => {
    expect(mod?.name).toBe('dsh-autofill-model-metadata')
    expect(mod?.inject).toEqual(['llm'])
    expect(typeof mod?.apply).toBe('function')
    expect(typeof mod?.Config).toBe('function')
    // A plugin half must not carry a default export: the loader would try to
    // mount the namespace object as a function.
    expect(mod?.default).toBeUndefined()
  })

  it('keeps the host singletons external instead of bundling a second copy', () => {
    expect(bundle).toContain('from "@deepseek-ai/schemastery"')
    // A bundled copy would fork schemastery's global ref registry and the
    // host's own cordis instance.
    expect(bundle).not.toMatch(/from "cordis"/)
    expect(bundle).not.toContain('schemastery_refs')
    expect(bundle).not.toContain('kSchema')
    // Only node builtins and the one declared dependency may be imported.
    const specifiers = [...bundle.matchAll(/from "([^"]+)"/g)].map((match) => match[1])
    expect(new Set(specifiers)).toEqual(new Set(['node:fs', 'node:os', 'node:path', '@deepseek-ai/schemastery']))
  })

  it('inlines its own modules: no source-tree specifiers survive', () => {
    expect(bundle).not.toMatch(/from "\.\.?\//)
    expect(bundle).not.toContain('.ts"')
  })

  it('ships a usable Config schema', () => {
    const json = (mod?.Config as { toJSON: () => { refs?: Record<string, { meta?: { volatile?: boolean } }> } }).toJSON()
    const volatile = Object.values(json.refs ?? {}).filter((node) => node?.meta?.volatile === true)
    expect(volatile.length).toBeGreaterThanOrEqual(5)
  })

  it('mounts without a settings service and never throws into the loader', () => {
    const ctx = {
      logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
      llm: { listConfigurableProviders: () => [] },
      get: () => undefined,
      inject: () => undefined,
      on: () => undefined,
    }
    // Empty mapping => inert, so a host without models.dev reachable is safe.
    expect(() => (mod?.apply as (ctx: unknown, config: unknown) => void)(ctx, { mapping: {} })).not.toThrow()
  })
})
