/**
 * Mount self-check: drive the plugin's `apply()` with a stub host that mirrors
 * the seams dsh 0.2.0-rc.2 exposes (`llm.listConfigurableProviders`, the
 * `settings` describe/mutate pair, the `webServer` seat), so composition is
 * exercised end to end without a running harness.
 */
import { Readable } from 'node:stream'
import { mkdtempSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context } from 'cordis'

import { apply, resolveOwnEntryId } from '../src/index.ts'
import type { ProviderRow, SettingsOp, SettingsView } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/** A fake IncomingMessage carrying one JSON body. */
function fakeReq(options: { method?: string; address?: string; body?: string; url?: string } = {}): IncomingMessage {
  const chunks = options.body === undefined || options.body === '' ? [] : [Buffer.from(options.body)]
  const req = Readable.from(chunks) as unknown as Record<string, unknown>
  req.method = options.method ?? 'POST'
  req.url = options.url ?? '/'
  req.socket = { remoteAddress: options.address ?? '127.0.0.1' }
  return req as unknown as IncomingMessage
}

/** A fake ServerResponse capturing what the handler wrote. */
function fakeRes(): { out: { status: number; body: string; headers: Record<string, string> }; res: ServerResponse } {
  const out = { status: 0, body: '', headers: {} as Record<string, string> }
  const res = {
    setHeader: (key: string, value: string) => {
      out.headers[key] = value
    },
    writeHead: (status: number) => {
      out.status = status
    },
    end: (body: string) => {
      out.body = body
    },
  }
  return { out, res: res as unknown as ServerResponse }
}

/** The plugin's own settings namespace: the id of its loader row. */
const OWN_NS = 'dsh-autofill-model-metadata'

/** The stub host: the two services this plugin composes with, plus the seat. */
function stubHost(
  options: {
    withSettings?: boolean
    providers?: ProviderRow[]
    withLoaderRow?: boolean
    /** The route's declared models; defaults to the single model the route declares. */
    models?: unknown[]
    /** The plugin's own effective config, as the host would describe it. */
    ownConfig?: Record<string, unknown>
  } = {},
) {
  const calls: Array<{ ns: string; ops: SettingsOp[]; revision: number }> = []
  const route = 'my-gateway'
  const view: SettingsView = {
    ns: 'llm-pi-ai',
    revision: 11,
    value: {
      providers: {
        [route]: {
          api: 'openai-completions',
          models: options.models ?? [{ id: 'fast-model' }],
        },
      },
    },
  }
  /**
   * The plugin's own Config, which the settings page edits.
   *
   * The host describes the *effective* config, so the row's `mapping` is always
   * present — an empty table included, since that is this field's default. The
   * stub mirrors that by starting from the resolved config it was given.
   */
  const ownView: SettingsView = {
    ns: OWN_NS,
    revision: 3,
    value: options.ownConfig ?? { mapping: {} },
  }
  const configure = vi.fn(() => () => undefined)
  const settings = {
    describe: vi.fn(() => [view, ownView]),
    // The real service answers `true` when the write lands; a test can override
    // this once to model a host that refuses by resolving `false`.
    mutate: vi.fn(async (ns: string, ops: SettingsOp[], revision: number): Promise<boolean> => {
      calls.push({ ns, ops, revision })
      return true
    }),
    configure,
  }
  const handlers = new Map<string, (req: IncomingMessage, res: ServerResponse) => void>()
  const listeners = new Map<string, Array<() => void>>()
  const injections: Array<{ names: string[]; callback: (ctx: unknown) => void }> = []
  const effects: Array<() => void | (() => void)> = []
  const fiber = { id: 'plugin-fiber' }
  const ctx = {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    llm: { listConfigurableProviders: () => options.providers ?? [{ provider: route, displayName: route, settingsNs: 'llm-pi-ai', settingsPath: ['providers', route] }] },
    loader: {
      entries: () =>
        options.withLoaderRow === false
          ? []
          : [{ options: { id: OWN_NS, name: OWN_NS }, fiber, disabled: false }],
    },
    fiber,
    effect: (callback: () => void | (() => void)) => {
      effects.push(callback)
      callback()
    },
    get: (name: string) => (name === 'settings' ? (options.withSettings === false ? undefined : settings) : undefined),
    inject: (names: string[], callback: (ctx: unknown) => void) => {
      injections.push({ names, callback })
    },
    on: (event: string, listener: () => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener])
    },
  }
  const webServer = {
    register: (seat: { path: string; handler: (req: IncomingMessage, res: ServerResponse) => void }) => {
      handlers.set(seat.path, seat.handler)
    },
  }
  return { ctx, settings, configure, calls, handlers, listeners, injections, effects, webServer, route, fiber, ownView }
}

/** One throwaway catalog cache so the tests never touch the real state dir. */
function config(mapping: Record<string, Record<string, string>>, extra: Record<string, unknown> = {}) {
  return {
    mapping,
    cachePath: join(mkdtempSync(join(tmpdir(), 'dsh-meta-host-')), 'models.dev.json'),
    cacheTTLHours: 24,
    ...extra,
  }
}

const BASE = '/api/dsh-autofill-model-metadata'
const APPLY_PATH = `${BASE}/apply`
const STATUS_PATH = `${BASE}/status`
const INSPECT_PATH = `${BASE}/inspect`
const CATALOG_PATH = `${BASE}/catalog`
const MAPPING_PATH = `${BASE}/mapping`
const LIVE_PATH = `${BASE}/page-live`

describe('host composition', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => CATALOG })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('applies the declared mapping at startup through the settings seam', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))

    await vi.waitFor(() => expect(host.calls).toHaveLength(1))
    expect(host.calls[0].ns).toBe('llm-pi-ai')
    expect(host.calls[0].revision).toBe(11)
    expect(host.calls[0].ops[0].path).toEqual(['providers', 'my-gateway', 'models'])
    expect(host.calls[0].ops[0].value).toEqual([
      {
        id: 'fast-model',
        name: 'GPT-5.4',
        contextWindow: 1050000,
        maxTokens: 128000,
        input: ['text', 'image'],
        reasoningEfforts: { off: 'none', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
      },
    ])
  })

  it('stays completely inert without a mapping — not even the catalog is fetched', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({}))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fetch).not.toHaveBeenCalled()
    expect(host.calls).toHaveLength(0)
  })

  it('honours dryRun', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { dryRun: true }))
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(host.calls).toHaveLength(0)
  })

  it('re-applies when the config is edited live', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))
    await vi.waitFor(() => expect(host.calls).toHaveLength(1))

    const listener = host.listeners.get('loader/volatile-update')?.[0]
    expect(listener).toBeDefined()
    listener?.()
    await vi.waitFor(() => expect(host.calls).toHaveLength(2))
  })

  it('claims the settings seam through inject when it comes up later', async () => {
    const host = stubHost({ withSettings: false })
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))

    await vi.waitFor(() => expect(host.injections.some((entry) => entry.names.includes('settings'))).toBe(true))
    expect(host.calls).toHaveLength(0)

    const injection = host.injections.find((entry) => entry.names.includes('settings'))
    injection?.callback({ settings: host.settings })
    await vi.waitFor(() => expect(host.calls).toHaveLength(1))
  })

  it('claims the web server seat and answers the manual apply endpoint', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))
    await vi.waitFor(() => expect(host.calls).toHaveLength(1))

    const injection = host.injections.find((entry) => entry.names.includes('webServer'))
    injection?.callback({ webServer: host.webServer })
    const handler = host.handlers.get(APPLY_PATH)
    expect(handler).toBeDefined()

    const ok = fakeRes()
    handler?.(fakeReq({ body: JSON.stringify({ route: 'my-gateway' }) }), ok.res)
    await vi.waitFor(() => expect(ok.out.status).toBe(200))
    expect(JSON.parse(ok.out.body).ok).toBe(true)
    expect(host.calls).toHaveLength(2)
  })

  it('refuses a non-loopback caller on the apply endpoint', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))
    const injection = host.injections.find((entry) => entry.names.includes('webServer'))
    injection?.callback({ webServer: host.webServer })

    const denied = fakeRes()
    host.handlers.get(APPLY_PATH)?.(fakeReq({ address: '10.0.0.9' }), denied.res)
    await vi.waitFor(() => expect(denied.out.status).toBe(403))
    expect(denied.out.body).toContain('loopback-only')
  })

  it('reports a refused route on the wire without writing', async () => {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/does-not-exist' } }))
    await vi.waitFor(() => expect(host.injections.some((entry) => entry.names.includes('webServer'))).toBe(true))
    const injection = host.injections.find((entry) => entry.names.includes('webServer'))
    injection?.callback({ webServer: host.webServer })

    const res = fakeRes()
    host.handlers.get(APPLY_PATH)?.(fakeReq({ body: '{}' }), res.res)
    await vi.waitFor(() => expect(res.out.status).toBe(200))
    const payload = JSON.parse(res.out.body)
    expect(payload.results[0].status).toBe('refused')
    expect(payload.results[0].errors[0].kind).toBe('unknown-model')
    expect(host.calls).toHaveLength(0)
  })

  it('survives a catalog outage by logging instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ENOTFOUND')
    }))
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }))
    await vi.waitFor(() => expect(host.ctx.logger.error).toHaveBeenCalled())
    expect(host.calls).toHaveLength(0)
  })
})

describe('settings page endpoints', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => CATALOG })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** Mount the plugin and hand back the seated handlers. */
  async function mount(options: Parameters<typeof stubHost>[0] = {}, cfg = config({}, { applyOnStart: false })) {
    // The host describes the plugin's *effective* config, so the row carries the
    // mapping this test declared; the page reads its state back from there.
    const host = stubHost({ ownConfig: { mapping: (cfg as { mapping?: unknown }).mapping ?? {} }, ...options })
    apply(host.ctx as unknown as Context, cfg)
    await vi.waitFor(() => expect(host.injections.some((entry) => entry.names.includes('webServer'))).toBe(true))
    host.injections.find((entry) => entry.names.includes('webServer'))?.callback({ webServer: host.webServer })
    const call = async (
      path: string,
      request: { method?: string; body?: string; address?: string; query?: string } = {},
    ): Promise<{ status: number; payload: any }> => {
      const handler = host.handlers.get(path)
      if (handler === undefined) throw new Error(`no handler is seated on ${path}`)
      const res = fakeRes()
      const url = request.query === undefined ? path : `${path}?${request.query}`
      handler(fakeReq({ ...request, method: request.method ?? 'POST', url }), res.res)
      await vi.waitFor(() => expect(res.out.status).toBeGreaterThan(0))
      return { status: res.out.status, payload: JSON.parse(res.out.body) }
    }
    return { host, call }
  }

  it('status paints every route and its gaps without touching the network', async () => {
    const { call } = await mount(
      {},
      config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { applyOnStart: false }),
    )
    const { status, payload } = await call(STATUS_PATH, { method: 'GET' })

    expect(status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
    expect(payload.ns).toBe(OWN_NS)
    expect(payload.mapping).toEqual({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } })
    expect(payload.resolved).toBe(false)
    const [report] = payload.reports
    expect(report.route).toBe('my-gateway')
    expect(report.models[0]).toMatchObject({ id: 'fast-model', source: 'openai/gpt-5.4', state: 'mapped' })
    expect(report.counts).toMatchObject({ models: 1, mapped: 1 })
  })

  it('reports the mapping the settings document holds, not a stale volatile copy', async () => {
    // The loader refreshes the volatile config a moment after a write, so reading
    // it straight after a save can hand the page the previous table — which the
    // page would then show as "unsaved". The document is what the operator wrote.
    const stale = { 'my-gateway': { 'fast-model': 'openai/gpt-4o' } }
    const written = { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }
    const { call } = await mount(
      { ownConfig: { mapping: written } },
      config(stale, { applyOnStart: false }),
    )
    const { payload } = await call(STATUS_PATH, { method: 'GET' })
    expect(payload.mapping).toEqual(written)
    expect(payload.routes).toEqual(['my-gateway'])
    expect(payload.reports[0].models[0].source).toBe('openai/gpt-5.4')
  })

  it('inspect resolves the report against the catalog', async () => {
    const { call } = await mount(
      { models: [{ id: 'fast-model' }, { id: 'unmapped-model' }] },
      config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { applyOnStart: false }),
    )
    const { status, payload } = await call(INSPECT_PATH, { method: 'GET' })

    expect(status).toBe(200)
    expect(payload.resolved).toBe(true)
    expect(payload.catalog.providers).toBeGreaterThan(0)
    const [report] = payload.reports
    const fast = report.models.find((model: { id: string }) => model.id === 'fast-model')
    expect(fast.state).toBe('filled')
    expect(fast.filled).toMatchObject({ name: 'GPT-5.4', contextWindow: 1050000 })
    // The unmapped sibling is a refusal the page must surface before applying.
    expect(report.errors.map((error: { kind: string }) => error.kind)).toEqual(['missing-mapping'])
  })

  it('inspect still reports the mapping gaps when the catalog is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ENOTFOUND')
    }))
    const { call } = await mount(
      { models: [{ id: 'fast-model' }, { id: 'unmapped-model' }] },
      config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { applyOnStart: false }),
    )
    const { status, payload } = await call(INSPECT_PATH, { method: 'GET' })

    expect(status).toBe(200)
    expect(payload.resolved).toBe(false)
    expect(payload.catalogError).toContain('ENOTFOUND')
    expect(payload.reports[0].models[0]).toMatchObject({ id: 'fast-model', state: 'mapped' })
  })

  it('catalog searches for mapping targets', async () => {
    const { call } = await mount()
    const { status, payload } = await call(CATALOG_PATH, { method: 'GET', query: 'q=gpt-5.4&limit=5' })

    expect(status).toBe(200)
    expect(payload.count).toBeGreaterThan(0)
    expect(payload.candidates[0]).toMatchObject({ source: 'openai/gpt-5.4', usable: true, contextWindow: 1050000 })
  })

  it('clamps the search limit instead of trusting the caller', async () => {
    const { call } = await mount()
    const { payload } = await call(CATALOG_PATH, { method: 'GET', query: 'q=&limit=999999' })
    expect(payload.limit).toBe(200)
    const { payload: junk } = await call(CATALOG_PATH, { method: 'GET', query: 'q=&limit=abc' })
    expect(junk.limit).toBe(40)
  })

  it('answers 503 for a search when the catalog cannot be read at all', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ENOTFOUND')
    }))
    const { call } = await mount()
    const { status, payload } = await call(CATALOG_PATH, { method: 'GET', query: 'q=gpt' })
    expect(status).toBe(503)
    expect(payload.ok).toBe(false)
  })

  it('persists the mapping to the plugin own namespace and applies exactly what was written', async () => {
    const mapping = { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }
    const { host, call } = await mount()
    const { status, payload } = await call(MAPPING_PATH, { body: JSON.stringify({ mapping, apply: true }) })

    expect(status).toBe(200)
    expect(payload.ns).toBe(OWN_NS)
    // One atomic set of the whole table, fenced by the own namespace revision.
    expect(host.calls[0]).toEqual({ ns: OWN_NS, ops: [{ op: 'set', path: ['mapping'], value: mapping }], revision: 3 })
    // The apply then used the mapping it just wrote, not a stale live reference.
    const applied = host.calls.find((entry) => entry.ns === 'llm-pi-ai')
    expect(applied?.ops[0].path).toEqual(['providers', 'my-gateway', 'models'])
    expect(applied?.ops[0].value).toMatchObject([{ id: 'fast-model', name: 'GPT-5.4' }])
  })

  it('reports a landed write even when the pass that followed failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ENOTFOUND')
    }))
    const mapping = { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }
    const { host, call } = await mount()
    const { status, payload } = await call(MAPPING_PATH, { body: JSON.stringify({ mapping, apply: true }) })

    // The mapping is saved: answering an error would tell the operator nothing
    // was written, which is the opposite of the truth.
    expect(status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(host.calls[0]).toEqual({ ns: OWN_NS, ops: [{ op: 'set', path: ['mapping'], value: mapping }], revision: 3 })
    expect(payload.applyError).toContain('ENOTFOUND')
    expect(payload.applied).toBeUndefined()
  })

  it('does not apply when the caller only saves', async () => {
    const { host, call } = await mount()
    await call(MAPPING_PATH, { body: JSON.stringify({ mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } } }) })
    expect(host.calls.map((entry) => entry.ns)).toEqual([OWN_NS])
  })

  it('refuses a save made against a revision the document has moved past', async () => {
    // The page sends the revision it read. If the mapping changed underneath it —
    // an edit in the config document, another window — the write must fail closed
    // instead of replacing the whole table with the page's stale copy.
    const { host, call } = await mount(
      { ownConfig: { mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } } } },
      config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { applyOnStart: false }),
    )
    host.ownView.revision = 9
    const { status, payload } = await call(MAPPING_PATH, {
      body: JSON.stringify({ mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-4o' } }, revision: 3 }),
    })

    expect(status).toBe(400)
    expect(payload.error).toContain('changed since this page read it')
    // Nothing was written, so the document still holds the other editor's table.
    expect(host.calls).toHaveLength(0)
  })

  it('writes when the page sends the revision it actually read', async () => {
    const { host, call } = await mount(
      { ownConfig: { mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } } } },
      config({ 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } }, { applyOnStart: false }),
    )
    const mapping = { 'my-gateway': { 'fast-model': 'openai/gpt-4o' } }
    const { status } = await call(MAPPING_PATH, { body: JSON.stringify({ mapping, revision: 3 }) })
    expect(status).toBe(200)
    expect(host.calls[0]).toMatchObject({ ns: OWN_NS, revision: 3 })
  })

  it('reports the revision with the mapping so the page can send it back', async () => {
    const { call } = await mount(
      { ownConfig: { mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } } } },
      config({}, { applyOnStart: false }),
    )
    const { payload } = await call(STATUS_PATH, { method: 'GET' })
    expect(payload.revision).toBe(3)
    const inspected = await call(INSPECT_PATH, { method: 'GET' })
    expect(inspected.payload.revision).toBe(3)
  })

  it('never reports a refused write as a save', async () => {
    // A host that says no by resolving `false` (rather than throwing) must still
    // produce an error: reporting success here would tell the operator their
    // mapping was stored when it was not.
    const { host, call } = await mount()
    host.settings.mutate.mockResolvedValueOnce(false)
    const { status, payload } = await call(
      MAPPING_PATH,
      { body: JSON.stringify({ mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-5.4' } } }) },
    )
    expect(status).toBe(400)
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('refused the write')
  })

  it('refuses a mapping that is not a string table', async () => {
    const { host, call } = await mount()
    for (const mapping of [null, [], { gw: { a: 42 } }, 'nope']) {
      const { status, payload } = await call(MAPPING_PATH, { body: JSON.stringify({ mapping }) })
      expect(status).toBe(400)
      expect(payload.error).toContain('mapping must be')
    }
    expect(host.calls).toHaveLength(0)
  })

  it('refuses to persist a mapping when the plugin has no loader row', async () => {
    const { host, call } = await mount({ withLoaderRow: false })
    const { status, payload } = await call(MAPPING_PATH, { body: JSON.stringify({ mapping: {} }) })
    expect(status).toBe(400)
    expect(payload.error).toContain('no loader row')
    expect(host.calls).toHaveLength(0)
  })

  it('refuses every settings page endpoint to a non-loopback caller', async () => {
    const { call } = await mount()
    for (const path of [APPLY_PATH, STATUS_PATH, INSPECT_PATH, CATALOG_PATH, MAPPING_PATH, LIVE_PATH]) {
      const { status, payload } = await call(path, { method: 'GET', address: '10.0.0.9' })
      expect(status, path).toBe(403)
      expect(payload.error).toContain('loopback-only')
    }
  })

  it('refuses the wrong method on every endpoint', async () => {
    const { call } = await mount()
    for (const path of [STATUS_PATH, INSPECT_PATH, CATALOG_PATH]) {
      const { status } = await call(path, { method: 'POST' })
      expect(status, path).toBe(405)
    }
    // The live check-in is the one endpoint that wants a POST.
    expect((await call(LIVE_PATH, { method: 'GET' })).status).toBe(405)
    const { status } = await call(APPLY_PATH, { method: 'GET' })
    expect(status).toBe(405)
  })
})

describe('settings form policy', () => {
  /** Mount the plugin and hand back the seated handlers plus the effects. */
  async function seat(extra: Record<string, unknown> = {}) {
    const host = stubHost()
    apply(host.ctx as unknown as Context, config({}, { applyOnStart: false, ...extra }))
    await vi.waitFor(() => expect(host.injections.some((entry) => entry.names.includes('webServer'))).toBe(true))
    host.injections.find((entry) => entry.names.includes('webServer'))?.callback({ webServer: host.webServer })
    const report = async (): Promise<{ status: number; payload: any }> => {
      const res = fakeRes()
      host.handlers.get(LIVE_PATH)?.(fakeReq({ body: '{}' }), res.res)
      await vi.waitFor(() => expect(res.out.status).toBeGreaterThan(0))
      return { status: res.out.status, payload: JSON.parse(res.out.body) }
    }
    return { host, report }
  }

  it('keeps the host-generated form until the page reports in, then drops it once', async () => {
    const { host, report } = await seat()

    // Nothing has proven the page can load, so stock settings stay untouched.
    expect(host.configure).not.toHaveBeenCalled()

    const first = await report()
    expect(first.status).toBe(200)
    expect(first.payload).toMatchObject({ ok: true, policy: 'auto', builtinFormDropped: true, ns: OWN_NS })
    expect(host.configure).toHaveBeenCalledWith({ auto: false }, host.fiber)

    // A second report must not configure twice: the host throws on that.
    const second = await report()
    expect(second.payload.builtinFormDropped).toBe(true)
    expect(host.configure).toHaveBeenCalledTimes(1)
  })

  it('keeps the generated form even when the page is live, under `always`', async () => {
    const { host, report } = await seat({ builtinSettingsForm: 'always' })
    const { payload } = await report()
    expect(payload).toMatchObject({ policy: 'always', builtinFormDropped: false })
    expect(host.configure).not.toHaveBeenCalled()
  })

  it('drops the generated form up front under `never`, without waiting for a page', async () => {
    const { host, report } = await seat({ builtinSettingsForm: 'never' })
    expect(host.configure).toHaveBeenCalledWith({ auto: false }, host.fiber)
    const { payload } = await report()
    expect(payload).toMatchObject({ policy: 'never', builtinFormDropped: true })
    expect(host.configure).toHaveBeenCalledTimes(1)
  })

  it('accepts the booleans this field used to take', async () => {
    const off = await seat({ builtinSettingsForm: false })
    expect(off.host.configure).toHaveBeenCalledTimes(1)

    const on = await seat({ builtinSettingsForm: true })
    expect(on.host.configure).not.toHaveBeenCalled()
    const { payload } = await on.report()
    expect(payload.policy).toBe('always')
  })

  it('survives a host whose settings service cannot drop the form, and says so honestly', async () => {
    const host = stubHost()
    // A pre-0.2.0-rc.2 settings seam has no `configure`.
    ;(host.settings as { configure?: unknown }).configure = undefined
    apply(host.ctx as unknown as Context, config({}, { applyOnStart: false, builtinSettingsForm: 'never' }))
    await vi.waitFor(() => expect(host.injections.some((entry) => entry.names.includes('webServer'))).toBe(true))
    host.injections.find((entry) => entry.names.includes('webServer'))?.callback({ webServer: host.webServer })
    expect(host.ctx.logger.error).not.toHaveBeenCalled()

    // The check-in must not claim a drop that never happened.
    const res = fakeRes()
    host.handlers.get(LIVE_PATH)?.(fakeReq({ body: '{}' }), res.res)
    await vi.waitFor(() => expect(res.out.status).toBeGreaterThan(0))
    expect(JSON.parse(res.out.body).builtinFormDropped).toBe(false)
  })
})

describe('resolveOwnEntryId', () => {
  const id = 'dsh-autofill-model-metadata'

  it('prefers the row whose fiber is ours, even when another row comes first', () => {
    const mine = {}
    const ctx = {
      fiber: mine,
      loader: {
        entries: () => [
          { options: { id: 'other-row', name: id }, fiber: {}, disabled: false },
          { options: { id: 'mine', name: id }, fiber: mine, disabled: false },
        ],
      },
    }
    expect(resolveOwnEntryId(ctx)).toBe('mine')
  })

  it('takes our own fiber even when the row is named after an aggregate bundle', () => {
    // Mounted through an aggregate bundle the row id is the bundle's, so the
    // package-name rule must not be consulted before the fiber.
    const mine = {}
    const ctx = {
      fiber: mine,
      loader: {
        entries: () => [
          { options: { id: 'someone-else', name: 'other-package' }, fiber: {}, disabled: false },
          { options: { id: 'aggregate-bundle-row', name: '@acme/all-plugins' }, fiber: mine, disabled: false },
        ],
      },
    }
    expect(resolveOwnEntryId(ctx)).toBe('aggregate-bundle-row')
  })

  it('falls back to the first enabled row of this package', () => {
    const ctx = {
      fiber: {},
      loader: {
        entries: () => [
          { options: { id: 'disabled-row', name: id }, fiber: {}, disabled: true },
          { options: { id: 'enabled-row', name: id }, fiber: {}, disabled: false },
        ],
      },
    }
    expect(resolveOwnEntryId(ctx)).toBe('enabled-row')
  })

  it('ignores rows of other packages and malformed ids', () => {
    const ctx = {
      fiber: {},
      loader: {
        entries: () => [
          { options: { id: 'someone-else', name: 'other-package' }, fiber: {}, disabled: false },
          { options: { id: '', name: id }, fiber: {}, disabled: false },
          { options: { name: id }, fiber: {}, disabled: false },
        ],
      },
    }
    expect(resolveOwnEntryId(ctx)).toBeUndefined()
  })

  it('answers undefined rather than throwing when the loader is unavailable', () => {
    expect(resolveOwnEntryId(undefined)).toBeUndefined()
    expect(resolveOwnEntryId({})).toBeUndefined()
    expect(
      resolveOwnEntryId({
        loader: {
          entries: () => {
            throw new Error('no loader')
          },
        },
      }),
    ).toBeUndefined()
  })
})
