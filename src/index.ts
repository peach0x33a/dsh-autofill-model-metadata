/**
 * dsh-autofill-model-metadata — host half.
 *
 * Ports the explicit-mapping semantics of `pi-autofill-model-metadata` to the
 * DSH models settings: the operator writes down, per route and per model, which
 * models.dev record supplies the metadata
 *
 * ```yaml
 * - id: dsh-autofill-model-metadata
 *   name: dsh-autofill-model-metadata
 *   config:
 *     mapping:
 *       my-gateway:
 *         fast-model: google/gemini-flash-latest
 *         reasoner: anthropic/claude-opus-4-5
 * ```
 *
 * and the plugin fills the missing capability fields of those `models` entries
 * from that exact record. Nothing is guessed and nothing is written unless the
 * whole route resolves.
 *
 * @module dsh-autofill-model-metadata
 */

import { appendFileSync, mkdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import z from '@deepseek-ai/schemastery'
import type { Context } from 'cordis'

import { applyRoutes, readAt, type RouteOutcome } from './core/apply.ts'
import { CatalogStore, type CatalogLoad } from './core/catalog.ts'
import { reportRoutes, searchCatalog, type ReportedRoute } from './core/inspect.ts'
import type { ProviderRow, SettingsSeam, SettingsView } from './core/types.ts'

/** Stable cordis plugin name. */
export const name = 'dsh-autofill-model-metadata'

/** The service this plugin composes over: the llm directory knows the routes. */
export const inject = ['llm']

/** The plugin's own state directory name under `$DSH_HOME/plugins`. */
const NS = 'dsh-autofill-model-metadata'

/** The living models.dev catalog. */
const DEFAULT_URL = 'https://models.dev/api.json'

/** Every settings-page endpoint, all loopback-only. */
const BASE_PATH = '/api/dsh-autofill-model-metadata'

/** `POST` apply now; `GET` what the last pass did. */
const APPLY_PATH = `${BASE_PATH}/apply`

/** `GET` the last pass and the unresolved route report. */
const STATUS_PATH = `${BASE_PATH}/status`

/** `GET` the route report resolved against the catalog (loads it if needed). */
const INSPECT_PATH = `${BASE_PATH}/inspect`

/** `GET ?q=` search the catalog for mapping targets. */
const CATALOG_PATH = `${BASE_PATH}/catalog`

/** `POST {mapping, apply?}` replace the mapping (and optionally apply it). */
const MAPPING_PATH = `${BASE_PATH}/mapping`

/**
 * Where the browser half reports that it loaded.
 *
 * The default `builtinSettingsForm: 'auto'` policy waits for this call before
 * dropping the host-generated settings form, so stock settings survive a client
 * bundle that never runs.
 */
const LIVE_PATH = `${BASE_PATH}/page-live`

/** A body larger than this is refused rather than buffered. */
const MAX_BODY_BYTES = 64 * 1024

/**
 * The schema surface {@link Config} exposes.
 *
 * The concrete schemastery schema type is inferred through `Dict` types that
 * live under a pnpm-private path, which rollers of declaration files cannot
 * name portably (TS2742). Declaring the surface locally keeps the emitted
 * `.d.mts` portable while leaving the runtime object untouched.
 */
export interface ConfigSchema {
  (value: unknown): Record<string, unknown>
  toJSON(): unknown
}

/**
 * Plugin configuration.
 *
 * Every field is volatile: the host renders this schema into the plugin's
 * settings form and applies an edit without remounting the entry.
 */
export const Config = z.object({
  /** The models.dev catalog URL. */
  modelsDevUrl: z.string().default(DEFAULT_URL).volatile(),
  /** Catalog cache location; defaults to `$DSH_HOME/plugins/<name>/models.dev.json`. */
  cachePath: z.string().required(false).volatile(),
  /** Catalog cache lifetime in hours; 0 refetches every time. */
  cacheTTLHours: z.number().min(0).default(24).volatile(),
  /** Apply once at startup. */
  applyOnStart: z.boolean().default(true).volatile(),
  /** Report what would change without writing settings. */
  dryRun: z.boolean().default(false).volatile(),
  /**
   * Require every declared model of a mapped route to be mapped. Turning this
   * off leaves unmapped models untouched; a mapping that names a model the route
   * does not declare is refused either way.
   */
  requireCompleteMapping: z.boolean().default(true).volatile(),
  /**
   * Whether to keep the settings form the host generates from this schema.
   *
   * - `auto` (default): keep it unless the browser half proves it loaded. The
   *   graphical page reports in as soon as it registers, and only then does the
   *   host drop the generated form — so a page that never loads (old host,
   *   missing asset, plugin error) leaves the stock settings form in place as
   *   the fallback.
   * - `always`: never drop it, even when the page is live.
   * - `never`: drop it immediately, without waiting for the page.
   */
  builtinSettingsForm: z.string().default('auto').volatile(),
  /**
   * The explicit mapping: `mapping.<route>.<modelId> = "<models.dev provider>/<models.dev model>"`.
   * An empty mapping keeps the plugin completely inert — not even the catalog is fetched.
   */
  mapping: z.dict(z.dict(z.string())).default({}).volatile(),
}) as unknown as ConfigSchema

/** How the plugin treats the host-generated settings form. */
export type BuiltinSettingsFormPolicy = 'auto' | 'always' | 'never'

/** The live values of {@link Config}. */
export interface ResolvedConfig {
  modelsDevUrl: string
  cachePath: string
  cacheTTLHours: number
  applyOnStart: boolean
  dryRun: boolean
  requireCompleteMapping: boolean
  builtinSettingsForm: BuiltinSettingsFormPolicy
  mapping: Record<string, Record<string, string>>
}

/** The logger surface this plugin uses (absent on a bare host). */
interface LoggerLike {
  info?: (...args: unknown[]) => void
  warn?: (...args: unknown[]) => void
  error?: (...args: unknown[]) => void
}

/** One profile entry, as the loader reports it. */
interface LoaderEntry {
  options?: { id?: unknown; name?: unknown }
  fiber?: unknown
  disabled?: unknown
}

/** The host contexts this plugin composes with, structurally. */
interface HostContext {
  logger?: LoggerLike
  llm?: { listConfigurableProviders?: () => ProviderRow[] }
  loader?: { entries?: () => LoaderEntry[] }
  /** The plugin instance's own fiber; the settings page policy is keyed by it. */
  fiber?: unknown
  effect?: (callback: () => void | (() => void), label?: string) => void
  on?: (event: string, listener: () => void) => void
}

/**
 * The plugin's own settings namespace: the id of the loader row that mounts it.
 *
 * The settings service keys forms by profile entry id, so the browser needs this
 * exact string to read and write the plugin's own configuration. The lookup
 * mirrors what a self-paging plugin does: the row carrying this package's name
 * whose fiber is ours, falling back to the first enabled row of that name.
 *
 * @param ctx - the plugin context.
 * @returns the entry id, or undefined when the loader does not expose the row.
 */
export function resolveOwnEntryId(ctx: unknown): string | undefined {
  const loader = (ctx as HostContext | undefined)?.loader
  const fiber = (ctx as HostContext | undefined)?.fiber
  let entries: LoaderEntry[]
  try {
    entries = loader?.entries?.() ?? []
  } catch {
    return undefined
  }
  let fallback: string | undefined
  for (const entry of entries) {
    const id = entry?.options?.id
    if (typeof id !== 'string' || id.length === 0) continue
    // Our own fiber is the strongest signal: a row mounted by an aggregate bundle
    // carries that bundle's name rather than ours, and the settings page must
    // still be able to address this plugin's own configuration.
    if (entry.fiber !== undefined && entry.fiber === fiber && entry.disabled !== true) return id
    if (entry?.options?.name !== NS || entry.disabled === true) continue
    fallback ??= id
  }
  return fallback
}

/** `$DSH_HOME`, falling back to `~/.dsh` the way the host does. */
export function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/** Append one best-effort line to this plugin's bootstrap trace. */
function trace(line: string): void {
  try {
    const path = join(dshHome(), 'plugins', NS, 'bootstrap.log')
    mkdirSync(dirname(path), { recursive: true })
    appendFileSync(path, `${new Date().toISOString()} [pid ${process.pid}] ${line}\n`)
  } catch {
    // tracing must never take the plugin down
  }
}

/**
 * One config field's live value: a volatile field arrives as a reference the
 * loader updates in place, so it is read through `get()` when present.
 */
function readField(field: unknown, fallback: unknown): unknown {
  if (field === undefined || field === null) return fallback
  if (typeof field === 'object' && typeof (field as { get?: unknown }).get === 'function') {
    const value = (field as { get: () => unknown }).get()
    return value === undefined ? fallback : value
  }
  return field
}

/** Resolve the live configuration, applying the schema defaults. */
export function resolveConfig(config: unknown): ResolvedConfig {
  const raw = (config ?? {}) as Record<string, unknown>
  const ttl = readField(raw.cacheTTLHours, 24)
  const mapping = readField(raw.mapping, {})
  return {
    modelsDevUrl: String(readField(raw.modelsDevUrl, DEFAULT_URL)),
    cachePath: String(readField(raw.cachePath, join(dshHome(), 'plugins', NS, 'models.dev.json'))),
    cacheTTLHours: typeof ttl === 'number' && Number.isFinite(ttl) && ttl >= 0 ? ttl : 24,
    applyOnStart: readField(raw.applyOnStart, true) !== false,
    dryRun: readField(raw.dryRun, false) === true,
    requireCompleteMapping: readField(raw.requireCompleteMapping, true) !== false,
    builtinSettingsForm: readPolicy(readField(raw.builtinSettingsForm, 'auto')),
    mapping: isMapping(mapping) ? mapping : {},
  }
}

/**
 * Read the settings-form policy, accepting the two booleans as aliases.
 *
 * `true`/`false` were the first spelling of this field; keeping them working
 * means an existing profile config is never the reason a page breaks.
 */
function readPolicy(value: unknown): BuiltinSettingsFormPolicy {
  if (value === true) return 'always'
  if (value === false) return 'never'
  return value === 'always' || value === 'never' ? value : 'auto'
}

/** Whether a value is a `route → { modelId → source }` table. */
function isMapping(value: unknown): value is Record<string, Record<string, string>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(
    (route) =>
      route !== null &&
      typeof route === 'object' &&
      !Array.isArray(route) &&
      Object.values(route as Record<string, unknown>).every((source) => typeof source === 'string'),
  )
}

/** Answer one JSON response. */
function writeJson(res: ServerResponse, status: number, value: unknown): void {
  try {
    res.setHeader?.('content-type', 'application/json; charset=utf-8')
    res.writeHead(status)
    res.end(JSON.stringify(value))
  } catch {
    // the socket went away mid-answer; nothing to recover
  }
}

/**
 * Read one small JSON request body (an empty body reads as `{}`).
 *
 * Deliberately event-based instead of `for await (const chunk of req)`: the LAN
 * replay layer hands handlers a Proxy over the request, and the async iterator's
 * internal `this === stream` check fails through that Proxy, so the body read
 * never settles and the endpoint hangs. Explicit listeners carry no identity
 * requirement.
 */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0
    let settled = false
    const chunks: Buffer[] = []
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    const finish = () => {
      if (settled) return
      settled = true
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      try {
        resolve(raw.length === 0 ? {} : (JSON.parse(raw) as Record<string, unknown>))
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        fail(new Error('request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', finish)
    req.on('error', fail)
    req.on('aborted', () => fail(new Error('request aborted')))
  })
}

/** The shared fence: loopback only (a trusted LAN request is replayed as one). */
function isLoopback(req: IncomingMessage): boolean {
  const address = req.socket?.remoteAddress ?? ''
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

/** One line per outcome, for the log and the endpoint answer. */
export function formatOutcome(outcome: RouteOutcome): string {
  const filled = outcome.applied
    .filter((row) => row.filledFields.length > 0)
    .map((row) => `${row.modelId}: ${row.filledFields.join(', ')}`)
  switch (outcome.status) {
    case 'applied':
      return `${outcome.route}: applied (${filled.join(' | ')})`
    case 'dry-run':
      return `${outcome.route}: would apply (${filled.join(' | ')})`
    case 'unchanged':
      return `${outcome.route}: already complete`
    default: {
      const reasons =
        outcome.errors.length > 0
          ? outcome.errors.map((error) => error.message).join('; ')
          : (outcome.reason ?? 'refused')
      return `${outcome.route}: refused — ${reasons}`
    }
  }
}

/**
 * Mount the plugin.
 *
 * The catalog is only read when the config declares at least one mapping, so an
 * unconfigured install stays completely inert. The settings service and the web
 * server seat can both come up after this plugin, so each is claimed through
 * `inject` when it is not there yet.
 *
 * @param ctx - the cordis context.
 * @param config - the raw plugin config (volatile fields arrive as references).
 */
export function apply(ctx: Context, config: unknown): void {
  const host = ctx as unknown as HostContext
  const state: {
    settings?: SettingsSeam
    last: RouteOutcome[]
    catalog?: CatalogLoad
    /** One store per distinct URL/cache/TTL triple, so the in-process cache holds. */
    store?: CatalogStore
    storeKey?: string
    /** Whether the host-generated settings form has already been dropped. */
    formDropped?: boolean
    /**
     * The browser half has reported in.
     *
     * Remembered because the check-in can land before the settings service is
     * up; `attachSettings` then applies the `auto` policy itself, so the page
     * loading early cannot leave the generated form behind forever.
     */
    pageLive?: boolean
  } = { last: [] }

  trace(`apply: called (mapping routes=${Object.keys(resolveConfig(config).mapping).join(',') || 'none'})`)

  /** The catalog store for the current configuration. */
  const storeFor = (cfg: ResolvedConfig): CatalogStore => {
    const key = `${cfg.modelsDevUrl}|${cfg.cachePath}|${cfg.cacheTTLHours}`
    if (state.store === undefined || state.storeKey !== key) {
      state.store = new CatalogStore({
        url: cfg.modelsDevUrl,
        cachePath: cfg.cachePath,
        ttlMs: cfg.cacheTTLHours * 60 * 60 * 1000,
        logger: host.logger,
      })
      state.storeKey = key
    }
    return state.store
  }

  /** Read the catalog, remembering it for every later endpoint call. */
  const loadCatalog = async (force = false): Promise<CatalogLoad> => {
    const load = await storeFor(resolveConfig(config)).load({ force })
    state.catalog = load
    return load
  }

  /** The provider directory, tolerating a host without one. */
  const providersOf = (): ProviderRow[] => host.llm?.listConfigurableProviders?.() ?? []

  /**
   * The mapping as the settings document holds it.
   *
   * The plugin's volatile config is refreshed by the loader a moment after a
   * write, so reading it straight after a save can hand the page the *previous*
   * table — the page then shows the edit it just saved as unsaved. Reading the
   * document is what the operator actually wrote, so that is what the page is
   * told; the volatile copy stays the source for applying.
   */
  /** This plugin's own settings descriptor, when it is served. */
  const ownView = (): SettingsView | undefined => {
    const ns = resolveOwnEntryId(ctx)
    return ns === undefined ? undefined : (state.settings?.describe() ?? []).find((row) => row.ns === ns)
  }

  const documentMapping = (): Record<string, Record<string, string>> => {
    const view = ownView()
    // `value` is the *effective* config — the profile's row merged with the user
    // layer — which is exactly what the operator sees and edits. An empty table
    // is a real value (it is this field's default), so presence is what decides,
    // never truthiness: treating `{}` as "missing" would hide a mapping the
    // operator really does have. `user` is only the override layer, and the
    // volatile copy is the last resort.
    for (const layer of [view?.value, view?.user]) {
      const table = readAt(layer, ['mapping'])
      if (table !== undefined) return isMapping(table) ? table : {}
    }
    return resolveConfig(config).mapping
  }

  /**
   * The mapping plus the revision it was read at.
   *
   * The page sends that revision back when it saves, which is what turns the
   * write into a real compare-and-set: an edit made in the config document while
   * the page sat open makes the save fail closed instead of silently replacing
   * the whole table with what the page happened to be showing.
   */
  const documentState = (): { mapping: Record<string, Record<string, string>>; revision?: number } => {
    const view = ownView()
    return { mapping: documentMapping(), revision: typeof view?.revision === 'number' ? view.revision : undefined }
  }

  /** The route report against whichever catalog is already in hand. */
  const reportOf = (catalog: CatalogLoad | undefined, mapping: Record<string, Record<string, string>>) => {
    if (state.settings === undefined) return []
    return reportRoutes({
      settings: state.settings,
      providers: providersOf(),
      mapping,
      catalog: catalog?.data,
      requireCompleteMapping: resolveConfig(config).requireCompleteMapping,
    })
  }

  /**
   * One apply pass: catalog read, then every mapped route.
   *
   * `options.mapping` overrides the live configuration, so a page that just wrote
   * a new mapping can apply exactly what it wrote without racing the loader's
   * volatile-reference update.
   */
  const run = async (
    options: { force?: boolean; routes?: string[]; mapping?: Record<string, Record<string, string>> } = {},
  ): Promise<RouteOutcome[]> => {
    const settings = state.settings
    if (settings === undefined) return []
    const cfg = resolveConfig(config)
    const declared = options.mapping ?? cfg.mapping
    const routes = options.routes
    const mapping =
      routes === undefined
        ? declared
        : Object.fromEntries(
            routes.filter((route) => declared[route] !== undefined).map((route) => [route, declared[route]]),
          )
    if (Object.keys(mapping).length === 0) {
      trace('run: no mapping declared — staying inert')
      return []
    }

    const load = await loadCatalog(options.force === true)
    trace(`run: catalog ${Object.keys(load.data).length} providers (stale=${load.stale})`)

    const outcomes = await applyRoutes({
      settings,
      providers: providersOf(),
      mapping,
      catalog: load.data,
      dryRun: cfg.dryRun,
      requireCompleteMapping: cfg.requireCompleteMapping,
    })
    state.last = outcomes
    for (const outcome of outcomes) {
      const line = formatOutcome(outcome)
      trace(`run: ${line}`)
      if (outcome.status === 'refused') host.logger?.warn?.(`${NS}: ${line}`)
      else host.logger?.info?.(`${NS}: ${line}`)
    }
    return outcomes
  }

  /** Report a failed pass without taking the plugin (or the host) down. */
  const report = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error)
    trace(`run: FAILED — ${message}`)
    host.logger?.error?.(`${NS}: apply failed — ${message}`)
    if (error instanceof Error && error.stack !== undefined) host.logger?.error?.(error.stack)
  }

  /** The catalog summary both `status` and `inspect` answer with. */
  const catalogBrief = (load: CatalogLoad | undefined) =>
    load === undefined
      ? undefined
      : {
          providers: Object.keys(load.data).length,
          stale: load.stale,
          fromCache: load.fromCache,
          fetchedAt: load.fetchedAt,
        }

  /** POST {route?}: apply now (optionally one route); no body applies every mapping. */
  const handleApply = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    void readJsonBody(req)
      .then((body) => {
        const route = typeof body?.route === 'string' && body.route.length > 0 ? [body.route] : undefined
        return run({ force: true, routes: route })
      })
      .then(
        (outcomes) =>
          writeJson(res, 200, {
            ok: true,
            results: outcomes,
            log: outcomes.map(formatOutcome),
            routes: reportOf(state.catalog, resolveConfig(config).mapping),
          }),
        (error) =>
          writeJson(res, 400, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? (error.stack ?? error.message) : String(error),
          }),
      )
  }

  /**
   * GET: everything a settings page paints before it touches the network.
   *
   * No catalog is fetched here: per-model states come out of whatever a previous
   * pass already loaded, and `{INSPECT_PATH}` fills in the resolution.
   */
  const handleStatus = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    const cfg = resolveConfig(config)
    const { mapping, revision } = documentState()
    writeJson(res, 200, {
      ok: true,
      ns: resolveOwnEntryId(ctx),
      revision,
      mapping,
      routes: Object.keys(mapping),
      dryRun: cfg.dryRun,
      requireCompleteMapping: cfg.requireCompleteMapping,
      resolved: state.catalog !== undefined,
      reports: reportOf(state.catalog, mapping),
      catalog: catalogBrief(state.catalog),
      last: state.last,
      log: state.last.map(formatOutcome),
    })
  }

  /** GET: the route report resolved against the catalog (loading it when needed). */
  const handleInspect = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    const { mapping, revision } = documentState()
    void loadCatalog(true)
      .then((load) =>
        writeJson(res, 200, {
          ok: true,
          ns: resolveOwnEntryId(ctx),
          revision,
          mapping,
          resolved: true,
          catalog: catalogBrief(load),
          reports: reportOf(load, mapping),
        }),
      )
      .catch((error: unknown) => {
        // An unreachable catalog must not hide the mapping state: answer
        // unresolved, with the reason, so the page can still show gaps.
        writeJson(res, 200, {
          ok: true,
          ns: resolveOwnEntryId(ctx),
          revision,
          mapping,
          resolved: false,
          catalogError: error instanceof Error ? error.message : String(error),
          catalog: catalogBrief(state.catalog),
          reports: reportOf(undefined, mapping),
        })
      })
  }

  /** GET ?q=&limit=: catalog records that could be used as a mapping target. */
  const handleCatalog = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const query = url.searchParams.get('q') ?? ''
    const requested = Number(url.searchParams.get('limit') ?? '40')
    const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 200) : 40
    void loadCatalog(false)
      .then((load) => {
        const candidates = searchCatalog(load.data, query, limit)
        writeJson(res, 200, { ok: true, query, limit, count: candidates.length, catalog: catalogBrief(load), candidates })
      })
      .catch((error: unknown) =>
        writeJson(res, 503, { ok: false, error: error instanceof Error ? error.message : String(error) }),
      )
  }

  /** POST {mapping, apply?}: replace the plugin's own mapping, then optionally apply it. */
  const handleMapping = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    void readJsonBody(req)
      .then(async (body) => {
        const settings = state.settings
        if (settings === undefined) throw new Error('the settings service is not available')
        if (!isMapping(body?.mapping)) throw new Error('mapping must be a { route: { modelId: "provider/model" } } table')
        const mapping = body.mapping as Record<string, Record<string, string>>
        const ns = resolveOwnEntryId(ctx)
        if (ns === undefined) throw new Error('this plugin has no loader row, so its mapping cannot be persisted')
        const view = (settings.describe() ?? []).find((candidate) => candidate.ns === ns)
        if (view === undefined) throw new Error(`settings namespace "${ns}" is not registered`)
        // A compare-and-set, not a blind write. When the page says which revision
        // it was showing, that revision is the fence: if the document moved on —
        // someone edited the mapping in the config file, or another window saved —
        // the write is refused rather than replacing the whole table with a stale
        // one. Without a revision from the caller there is nothing to compare
        // against, so the freshest one is used and the write proceeds.
        const expected = typeof body?.revision === 'number' ? body.revision : view.revision
        if (typeof body?.revision === 'number' && body.revision !== view.revision) {
          trace(`mapping: refused — the document moved from revision ${body.revision} to ${view.revision}`)
          throw new Error(
            `the mapping changed since this page read it (revision ${body.revision}, now ${view.revision}); reload and reapply your edit`,
          )
        }
        // A rejected write must never be reported as a save. Hosts differ on how
        // they say no — some throw, some resolve `false` — so both are treated as
        // failure, and only a truthy-or-undefined answer counts as written.
        const accepted = await settings.mutate(ns, [{ op: 'set', path: ['mapping'], value: mapping }], expected)
        if (accepted === false) {
          throw new Error(
            `the host refused the write to "${ns}" (revision ${view.revision}); reload and try again`,
          )
        }
        trace(`mapping: wrote ${Object.keys(mapping).length} route(s) to ${ns}`)
        // The write is done and must be reported as done: a failed pass is a
        // separate fact, and answering 400 for it would tell the operator that
        // nothing was saved when the mapping in fact landed.
        let applied: RouteOutcome[] | undefined
        let applyError: string | undefined
        if (body?.apply === true) {
          try {
            applied = await run({ force: true, mapping })
          } catch (error) {
            applyError = error instanceof Error ? error.message : String(error)
            trace(`mapping: saved, but the pass failed — ${applyError}`)
          }
        }
        writeJson(res, 200, {
          ok: true,
          ns,
          mapping,
          applied: applied === undefined ? undefined : applied.map(formatOutcome),
          applyError,
          routes: reportOf(state.catalog, mapping),
        })
      })
      .catch((error: unknown) =>
        writeJson(res, 400, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
      )
  }

  /**
   * Drop the host-generated settings form, once, against this plugin's fiber.
   *
   * `configure` throws when it is called twice for the same plugin instance, so
   * the decision is remembered rather than retried.
   */
  const dropBuiltinForm = (settings: SettingsSeam): void => {
    if (state.formDropped) return
    if (typeof settings.configure !== 'function') {
      // Nothing to drop: claiming it was would make the answer a lie.
      trace('bootstrap: this host cannot drop the generated settings form')
      return
    }
    state.formDropped = true
    try {
      host.effect?.(() => settings.configure?.({ auto: false }, host.fiber), `${NS}: own settings page`)
      trace('bootstrap: generated settings form dropped — the page is live')
    } catch (error) {
      state.formDropped = false
      host.logger?.warn?.(
        `${NS}: could not claim the settings page policy — ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Claim the settings seam; it may already be up, or appear later.
   *
   * The graphical page is preferred, but only once the browser half has proven
   * it loaded: under the default `auto` policy the host-generated form is left
   * alone here and dropped later, by {@link handlePageLive}, when the page
   * reports in. A page that never loads therefore leaves stock DSH settings —
   * the original form — as the way to edit this plugin.
   */
  const attachSettings = (settings: SettingsSeam): void => {
    if (state.settings !== undefined) return
    state.settings = settings
    trace('bootstrap: settings seam attached')
    const { builtinSettingsForm, applyOnStart } = resolveConfig(config)
    if (builtinSettingsForm === 'never') {
      dropBuiltinForm(settings)
    } else if (builtinSettingsForm === 'always') {
      trace('bootstrap: keeping the host-generated settings form (always)')
    } else if (state.pageLive === true) {
      // The page checked in before this service existed; honour it now.
      trace('bootstrap: the page is already live — dropping the generated settings form')
      dropBuiltinForm(settings)
    } else {
      trace('bootstrap: keeping the host-generated settings form until the page reports in')
    }
    if (applyOnStart) void run().catch(report)
  }

  /**
   * POST from the browser half: it registered, so the graphical page is live.
   *
   * This is the proof the `auto` policy waits for. It is a claim that the bundle
   * loaded, not that the page rendered — the page's own endpoints stay the real
   * contract, and a host that never receives this call simply keeps stock
   * settings.
   */
  const handlePageLive = (req: IncomingMessage, res: ServerResponse): void => {
    if (!isLoopback(req)) return writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
    if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
    state.pageLive = true
    const policy = resolveConfig(config).builtinSettingsForm
    if (policy === 'auto' && state.settings !== undefined) dropBuiltinForm(state.settings)
    writeJson(res, 200, {
      ok: true,
      ns: resolveOwnEntryId(ctx),
      policy,
      // The truth of the matter, not the policy's intent: a host with no
      // `configure` cannot drop anything, and saying otherwise would be a lie in
      // an API this plugin publishes.
      builtinFormDropped: state.formDropped === true,
    })
  }

  void (async () => {
    try {
      const settings = ctx.get('settings', false) as SettingsSeam | undefined
      if (settings !== undefined) attachSettings(settings)
      else {
        trace('bootstrap: settings service not up yet — attaching when it appears')
        ctx.inject(['settings'], (settingsCtx) => {
          attachSettings((settingsCtx as unknown as { settings: SettingsSeam }).settings)
        })
      }

      const webServer = ctx.get('webServer', false) as { register?: (route: unknown) => void } | undefined
      const seatEndpoints = (seat: { register?: (route: unknown) => void } | undefined): void => {
        if (seat === undefined || typeof seat.register !== 'function') return
        for (const [path, handler] of [
          [APPLY_PATH, handleApply],
          [STATUS_PATH, handleStatus],
          [INSPECT_PATH, handleInspect],
          [CATALOG_PATH, handleCatalog],
          [MAPPING_PATH, handleMapping],
          [LIVE_PATH, handlePageLive],
        ] as const) {
          seat.register({ kind: 'exact', path, handler })
        }
        trace(`bootstrap: endpoints on ${BASE_PATH}/{apply,status,inspect,catalog,mapping,page-live}`)
      }
      if (webServer !== undefined) seatEndpoints(webServer)
      else {
        trace('bootstrap: webserver seat not up yet — claiming it when it appears')
        ctx.inject(['webServer'], (webCtx) => {
          seatEndpoints((webCtx as unknown as { webServer: { register?: (route: unknown) => void } }).webServer)
        })
      }

      // A volatile config edit moved the live values under the same entry: the
      // mapping, the dry-run flag and the URL all follow without a remount.
      // (`loader/volatile-update` is a loader event, not one of the events the
      // cordis Context type knows about, so it goes through the structural seam.)
      host.on?.('loader/volatile-update', () => {
        trace('bootstrap: volatile update — re-applying')
        void run().catch(report)
      })
      trace('bootstrap: done')
    } catch (error) {
      trace(`bootstrap: FAILED — ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
      host.logger?.error?.(`${NS}: bootstrap failed — no model metadata was filled`)
      host.logger?.error?.(error)
    }
  })()
}
