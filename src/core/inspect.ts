/**
 * Read-only reporting for the settings page.
 *
 * The browser must be able to draw the whole picture — every gateway route, its
 * declared models, which ones are mapped, what a pass would fill, and what is
 * refused — without writing anything. This module answers that from the same
 * seam and the same rules the writer uses ({@link inspectRoute}), so the page can
 * never disagree with a pass.
 *
 * `catalog` is optional: without it the report still covers mapping completeness
 * (the part that needs no network), and marks every route `resolved: false`.
 *
 * @module dsh-autofill-model-metadata/inspect
 */

import { modelsArrayOf, readAt, TARGET_NS } from './apply.ts'
import { isAgentModel, capabilitiesFromModel, effortValues } from './entry.ts'
import { inspectRoute, type ModelInspection, type ModelState } from './plan.ts'
import type { Catalog, CatalogModel, ModelEntry, PlanError, ProviderRow, SettingsSeam } from './types.ts'

/** A model state as the page sees it: unresolved mapping presence included. */
export type ReportedState = ModelState | 'mapped'

/** One declared model, as reported to the page. */
export interface ReportedModel {
  id: string
  /** Fields the profile already declares. */
  declared: string[]
  /** The declared `mapping.<route>.<id>` value, when there is one. */
  source?: string
  state: ReportedState
  /** Catalog values a pass would add, keyed by field. */
  filled: Record<string, unknown>
  /** The refusal this model contributes, when the catalog was read. */
  error?: PlanError
}

/** One gateway route, as reported to the page. */
export interface ReportedRoute {
  route: string
  displayName?: string
  settingsNs: string
  /** The route exists in the settings document and declares models. */
  configured: boolean
  /** `mapping.<route>` exists. */
  mapped: boolean
  /** Whether the catalog was available, so states are catalog-derived. */
  resolved: boolean
  models: ReportedModel[]
  /** Mapping keys naming a model this route does not declare. */
  orphans: string[]
  /** Every refusal, in plan order (only when `resolved`). */
  errors: PlanError[]
  counts: { models: number; mapped: number; filled: number; unchanged: number; unmapped: number; invalid: number }
  /** Why the route could not be read at all (missing row, unregistered, unconfigured). */
  reason?: string
}

/** Everything {@link reportRoutes} needs. */
export interface ReportInput {
  settings: SettingsSeam
  providers: ProviderRow[]
  mapping: Record<string, Record<string, string>>
  catalog?: Catalog
  requireCompleteMapping?: boolean
}

/**
 * Count the states of one route's models.
 *
 * `mapped` counts entries whose presence is known but not yet resolved: that
 * only happens when the report ran without a catalog, and it must not be
 * confused with `unmapped`, which is a real gap the operator has to close.
 */
function countStates(models: ReportedModel[]): ReportedRoute['counts'] {
  const counts = { models: models.length, mapped: 0, filled: 0, unchanged: 0, unmapped: 0, invalid: 0 }
  for (const model of models) {
    if (model.state === 'filled') counts.filled += 1
    else if (model.state === 'unchanged') counts.unchanged += 1
    else if (model.state === 'invalid') counts.invalid += 1
    else if (model.state === 'mapped') counts.mapped += 1
    else counts.unmapped += 1
  }
  return counts
}

/** Project the planner's per-model inspection into the page's shape. */
function project(inspection: ModelInspection): ReportedModel {
  return {
    id: inspection.id,
    declared: inspection.declared,
    source: inspection.source,
    state: inspection.state,
    filled: inspection.filled,
    error: inspection.error,
  }
}

/**
 * Report every route the plugin could fill.
 *
 * Only *relevant* routes are reported: one the profile actually configures, or
 * one that appears in the mapping. The host advertises every provider it knows
 * how to speak to — dozens of them on a stock install — and listing the ones
 * nobody configured would bury the routes that matter under empty cards, which
 * is exactly what the settings page must not do.
 *
 * A mapped route that is *not* configured is still reported, with its reason, so
 * a typo in the mapping cannot hide.
 *
 * @param input - the settings seam, the provider directory, the mapping, and optionally a catalog.
 * @returns one report per relevant route, in provider order, mapped-but-unknown routes last.
 */
export function reportRoutes(input: ReportInput): ReportedRoute[] {
  const { settings, providers, mapping, catalog } = input
  const views = settings.describe() ?? []
  const reports: ReportedRoute[] = []
  const seen = new Set<string>()

  for (const row of providers ?? []) {
    if (row?.settingsNs !== TARGET_NS || typeof row.provider !== 'string') continue
    const route = row.provider
    seen.add(route)
    const table = mapping[route] ?? {}
    const mapped = Object.keys(table).length > 0
    const base: ReportedRoute = {
      route,
      displayName: row.displayName,
      settingsNs: row.settingsNs,
      configured: false,
      mapped,
      resolved: catalog !== undefined,
      models: [],
      orphans: [],
      errors: [],
      counts: { models: 0, mapped: 0, filled: 0, unchanged: 0, unmapped: 0, invalid: 0 },
    }

    const view = views.find((candidate) => candidate.ns === row.settingsNs)
    if (view === undefined) {
      // A route nobody mapped and nobody configured is not this plugin's news.
      if (!mapped) continue
      reports.push({ ...base, reason: `settings namespace "${row.settingsNs}" is not registered` })
      continue
    }
    const routePath = row.settingsPath ?? []
    if (readAt(view.value, routePath) === undefined) {
      if (!mapped) continue
      reports.push({ ...base, reason: `route "${route}" is not configured in ${row.settingsNs}` })
      continue
    }

    const modelsPath = [...routePath, 'models']
    const models: ModelEntry[] =
      modelsArrayOf(readAt(view.user, modelsPath)) ?? modelsArrayOf(readAt(view.value, modelsPath)) ?? []
    const declared = models.filter((entry) => typeof entry?.id === 'string' && entry.id.length > 0)
    base.configured = true

    if (catalog === undefined) {
      // No catalog: mapping presence only, which needs no network.
      const reported: ReportedModel[] = declared.map((entry) => ({
        id: entry.id,
        declared: ['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts'].filter(
          (field) => (entry as Record<string, unknown>)[field] !== undefined,
        ),
        source: table[entry.id],
        state: table[entry.id] === undefined ? 'unmapped' : 'mapped',
        filled: {},
      }))
      reports.push({
        ...base,
        models: reported,
        orphans: Object.keys(table).filter((id) => !declared.some((entry) => entry.id === id)),
        counts: countStates(reported),
      })
      continue
    }

    const inspection = inspectRoute({
      route,
      models: declared,
      mapping: table,
      catalog,
      requireCompleteMapping: input.requireCompleteMapping,
    })
    const reported = inspection.models.map(project)
    reports.push({
      ...base,
      models: reported,
      orphans: inspection.orphans,
      errors: inspection.errors,
      counts: countStates(reported),
    })
  }

  for (const route of Object.keys(mapping)) {
    if (seen.has(route)) continue
    const table = mapping[route] ?? {}
    reports.push({
      route,
      settingsNs: TARGET_NS,
      configured: false,
      mapped: Object.keys(table).length > 0,
      resolved: catalog !== undefined,
      models: [],
      orphans: [],
      errors: [],
      counts: { models: 0, mapped: 0, filled: 0, unchanged: 0, unmapped: 0, invalid: 0 },
      reason: `route "${route}" is not a configurable provider of ${TARGET_NS}`,
    })
  }

  return reports
}

/** One models.dev record offered as a mapping target. */
export interface CatalogCandidate {
  /** `<models.dev provider>/<models.dev model>`, ready to paste into the mapping. */
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
  /** Tool-calling, not deprecated: the plugin would accept it. */
  usable: boolean
  /** Why the plugin would refuse it, when it would. */
  problem?: string
  /** Effort levels the record declares, before the pi-ai mapping. */
  effortLevels?: string[]
}

/** Describe one catalog record as a candidate. */
function candidateFrom(provider: string, providerName: string | undefined, modelId: string, model: CatalogModel): CatalogCandidate {
  const capabilities = capabilitiesFromModel(model)
  const levels = effortValues(model)
  const problem =
    capabilities !== null
      ? undefined
      : `not a live tool-calling chat model (tool_call=${String(model.tool_call)}, status=${String(model.status)})`
  return {
    source: `${provider}/${modelId}`,
    provider,
    providerName,
    model: modelId,
    name: typeof model.name === 'string' ? model.name : undefined,
    contextWindow: model.limit?.context !== undefined && model.limit.context > 0 ? model.limit.context : undefined,
    maxTokens: model.limit?.output !== undefined && model.limit.output > 0 ? model.limit.output : undefined,
    input: Array.isArray(model.modalities?.input) ? model.modalities.input : undefined,
    toolCall: model.tool_call === true,
    status: typeof model.status === 'string' ? model.status : undefined,
    usable: isAgentModel(model),
    problem,
    effortLevels: levels.length > 0 ? levels : undefined,
  }
}

/** Rank one candidate against a query: lower is better, `undefined` means no match. */
function score(candidate: CatalogCandidate, query: string): number | undefined {
  const source = candidate.source.toLowerCase()
  const model = candidate.model.toLowerCase()
  const name = (candidate.name ?? '').toLowerCase()
  if (source === query) return 0
  if (model === query) return 1
  if (model.startsWith(query)) return 2
  if (model.includes(query)) return 3
  if (source.includes(query)) return 4
  if (name.includes(query)) return 5
  return undefined
}

/**
 * Search the catalog for mapping targets.
 *
 * Usable records sort before unusable ones at equal rank, so the first hit is
 * the one a pass would accept.
 *
 * @param catalog - a loaded models.dev payload.
 * @param query - free text: a model id, a name, or `provider/model`.
 * @param limit - maximum candidates to return.
 * @returns the best matches, best first.
 */
export function searchCatalog(catalog: Catalog | undefined, query: string, limit = 40): CatalogCandidate[] {
  const needle = query.trim().toLowerCase()
  if (catalog === undefined) return []
  const scored: Array<{ candidate: CatalogCandidate; rank: number }> = []
  for (const [provider, entry] of Object.entries(catalog)) {
    for (const [modelId, model] of Object.entries(entry?.models ?? {})) {
      const candidate = candidateFrom(provider, entry?.name, modelId, model)
      const rank = needle.length === 0 ? 6 : score(candidate, needle)
      if (rank === undefined) continue
      scored.push({ candidate, rank })
    }
  }
  scored.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank
    if (left.candidate.usable !== right.candidate.usable) return left.candidate.usable ? -1 : 1
    return left.candidate.source.localeCompare(right.candidate.source)
  })
  return scored.slice(0, Math.max(0, limit)).map((row) => row.candidate)
}
