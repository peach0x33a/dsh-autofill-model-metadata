/**
 * Transport for the settings page.
 *
 * The host half seats five loopback endpoints under
 * `/api/dsh-autofill-model-metadata`; the page runs in the same app, served by
 * the same `webServer`, so this is a same-origin `fetch` with no CORS dance and
 * no client RPC service to learn. Everything the page does — reading state,
 * searching the catalog, saving the mapping, applying it — goes through here,
 * which keeps the tests able to run against a stubbed `fetch`.
 *
 * @module dsh-autofill-model-metadata/client/api
 */

/** Where the host half seats its endpoints. */
export const API_BASE = '/api/dsh-autofill-model-metadata'

/** One catalog record offered as a mapping target (mirrors the host half). */
export interface Candidate {
  source: string
  provider: string
  providerName?: string
  model: string
  name?: string
  contextWindow?: number
  maxTokens?: number
  input?: string[]
  toolCall: boolean
  status?: string
  usable: boolean
  problem?: string
  effortLevels?: string[]
}

/** One declared model, as the host reports it. */
export interface ReportedModel {
  id: string
  declared: string[]
  source?: string
  state: 'filled' | 'unchanged' | 'unmapped' | 'invalid' | 'mapped'
  filled: Record<string, unknown>
  error?: { kind: string; message: string; modelId?: string }
}

/** One gateway route, as the host reports it. */
export interface ReportedRoute {
  route: string
  displayName?: string
  settingsNs: string
  configured: boolean
  mapped: boolean
  resolved: boolean
  models: ReportedModel[]
  orphans: string[]
  errors: Array<{ kind: string; message: string; modelId?: string }>
  counts: {
    models: number
    mapped: number
    filled: number
    unchanged: number
    unmapped: number
    invalid: number
  }
  reason?: string
}

/** The catalog summary the host answers with. */
export interface CatalogBrief {
  providers: number
  stale: boolean
  fromCache: boolean
  fetchedAt?: number
}

/** The `GET /status` answer: everything the page paints before any network. */
export interface StatusAnswer {
  ok: boolean
  ns?: string
  /** The settings revision this answer was read at; sent back when saving. */
  revision?: number
  mapping: Record<string, Record<string, string>>
  routes: string[]
  dryRun: boolean
  requireCompleteMapping: boolean
  resolved: boolean
  reports: ReportedRoute[]
  catalog?: CatalogBrief
  last: Array<{ route: string; status: string; applied: unknown[]; reason?: string }>
  log: string[]
}

/** The `GET /inspect` answer: the reports resolved against the catalog. */
export interface InspectAnswer {
  ok: boolean
  ns?: string
  /** The settings revision this answer was read at; sent back when saving. */
  revision?: number
  mapping: Record<string, Record<string, string>>
  resolved: boolean
  catalogError?: string
  catalog?: CatalogBrief
  reports: ReportedRoute[]
}

/** The `GET /catalog` answer. */
export interface SearchAnswer {
  ok: boolean
  query: string
  limit: number
  count: number
  catalog?: CatalogBrief
  candidates: Candidate[]
}

/** The `POST /mapping` answer. */
export interface SaveAnswer {
  ok: boolean
  ns?: string
  mapping: Record<string, Record<string, string>>
  applied?: string[]
  /** Why a requested pass failed, when the save itself landed. */
  applyError?: string
  routes?: ReportedRoute[]
}

/** The `POST /apply` answer. */
export interface ApplyAnswer {
  ok: boolean
  results: Array<{ route: string; status: string; applied: Array<{ modelId: string; filledFields: string[] }>; reason?: string }>
  log: string[]
  routes?: ReportedRoute[]
}

/** A failed call, carrying the host's own message when it gave one. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** The fetch surface this module needs, so tests can pass a stub. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** Read a JSON answer, turning a non-2xx into an {@link ApiError}. */
async function readJson<T>(fetcher: FetchLike, path: string, init?: RequestInit): Promise<T> {
  const response = await fetcher(`${API_BASE}${path}`, init)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(response.status, `the host answered ${response.status} without JSON`)
  }
  if (!response.ok) {
    const message = (payload as { error?: unknown })?.error
    throw new ApiError(response.status, typeof message === 'string' ? message : `the host answered ${response.status}`)
  }
  return payload as T
}

/** `GET /status`: the unresolved picture, no catalog fetch. */
export function fetchStatus(fetcher: FetchLike): Promise<StatusAnswer> {
  return readJson<StatusAnswer>(fetcher, '/status')
}

/** `GET /inspect`: the picture resolved against the catalog (loads it if needed). */
export function fetchInspect(fetcher: FetchLike): Promise<InspectAnswer> {
  return readJson<InspectAnswer>(fetcher, '/inspect')
}

/** `GET /catalog?q=`: candidate mapping targets. */
export function searchCatalog(fetcher: FetchLike, query: string, limit = 40): Promise<SearchAnswer> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  return readJson<SearchAnswer>(fetcher, `/catalog?${params.toString()}`)
}

/** `POST /mapping`: persist the whole table, optionally applying it in the same call. */
export function saveMapping(
  fetcher: FetchLike,
  mapping: Record<string, Record<string, string>>,
  apply: boolean,
  revision?: number,
): Promise<SaveAnswer> {
  return readJson<SaveAnswer>(fetcher, '/mapping', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(revision === undefined ? { mapping, apply } : { mapping, apply, revision }),
  })
}

/** `POST /apply`: fill every mapped route from the catalog. */
export function applyNow(fetcher: FetchLike, route?: string): Promise<ApplyAnswer> {
  return readJson<ApplyAnswer>(fetcher, '/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(route === undefined ? {} : { route }),
  })
}
