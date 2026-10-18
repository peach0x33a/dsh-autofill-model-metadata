/**
 * The settings driver: one route's plan → one atomic settings write.
 *
 * Each mapped route is handled independently and atomically: a refused route
 * writes nothing, and a successful one writes its whole `models` array in a
 * single path operation fenced by the revision the namespace was read at. The
 * revision is re-read immediately before the write, because every write bumps
 * it and a sweep spanning several routes would otherwise fence itself out after
 * the first one.
 *
 * @module dsh-autofill-model-metadata/apply
 */

import { planRoute, type PlanResult } from './plan.ts'
import type {
  AppliedRow,
  Catalog,
  ModelEntry,
  PlanError,
  ProviderRow,
  SettingsOp,
  SettingsSeam,
  SettingsView,
} from './types.ts'

/** The settings namespace whose provider profiles this plugin fills. */
export const TARGET_NS = 'llm-pi-ai'

/** How one mapped route ended. */
export type RouteStatus = 'applied' | 'dry-run' | 'unchanged' | 'refused'

/** One route's outcome. */
export interface RouteOutcome {
  route: string
  status: RouteStatus
  /** One row per mapped model, with the fields the catalog supplied. */
  applied: AppliedRow[]
  /** Refusals, when `status` is `refused`. */
  errors: PlanError[]
  /** Why the route was refused before planning (missing route, namespace, …). */
  reason?: string
  stack?: string
}

/** Everything one apply pass needs. */
export interface ApplyInput {
  settings: SettingsSeam
  providers: ProviderRow[]
  /** `mapping.<route>.<modelId>` → `"<models.dev provider>/<models.dev model>"`. */
  mapping: Record<string, Record<string, string>>
  catalog: Catalog | undefined
  /** Report what would change without writing. */
  dryRun?: boolean
  /** Every declared model of a mapped route needs a mapping. Default true. */
  requireCompleteMapping?: boolean
}

/** Read one path inside a settings layer; undefined when the path is absent. */
export function readAt(value: unknown, path: string[]): unknown {
  let current: unknown = value
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/** The `models` entries of one layer value: objects carrying a non-empty id. */
export function modelsArrayOf(value: unknown): ModelEntry[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter(
    (item): item is ModelEntry =>
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof (item as ModelEntry).id === 'string' &&
      (item as ModelEntry).id.length > 0,
  )
}

/** One refusal raised before planning could run. */
function refuse(route: string, reason: string): RouteOutcome {
  return { route, status: 'refused', applied: [], errors: [], reason }
}

/**
 * Apply the explicit mapping to every route it names.
 *
 * @param input - the settings seam, the provider directory, the mapping and the catalog.
 * @returns one outcome per mapped route, in mapping order.
 */
/**
 * Whether the route's model list moved between two reads.
 *
 * Compared by value rather than identity: the point is to notice an edit the
 * operator made while the pass was planning, and the settings service hands back
 * a fresh object every time even when nothing changed.
 *
 * @param before - the models the plan was built from.
 * @param after - the models just read back.
 */
function modelsChanged(before: ModelEntry[], after: ModelEntry[]): boolean {
  if (before.length !== after.length) return true
  return before.some((entry, index) => {
    const other = after[index]
    if (entry?.id !== other?.id) return true
    // Any declared field that would be overwritten counts as a change.
    return JSON.stringify(entry) !== JSON.stringify(other)
  })
}

export async function applyRoutes(input: ApplyInput): Promise<RouteOutcome[]> {
  const { settings, providers, mapping, catalog } = input
  const routes = Object.keys(mapping ?? {})
  const outcomes: RouteOutcome[] = []

  for (const route of routes) {
    const table = mapping[route] ?? {}
    const row = (providers ?? []).find(
      (candidate) => candidate?.settingsNs === TARGET_NS && candidate.provider === route,
    )
    if (row === undefined) {
      outcomes.push(
        refuse(route, `route "${route}" is not a configurable provider of ${TARGET_NS}`),
      )
      continue
    }

    const view = (settings.describe() ?? []).find((candidate) => candidate.ns === row.settingsNs)
    if (view === undefined) {
      outcomes.push(refuse(route, `settings namespace "${row.settingsNs}" is not registered`))
      continue
    }

    const routePath = row.settingsPath ?? []
    const modelsPath = [...routePath, 'models']
    if (readAt(view.value, routePath) === undefined) {
      outcomes.push(refuse(route, `route "${route}" is not configured in ${row.settingsNs}`))
      continue
    }

    const models =
      modelsArrayOf(readAt(view.user, modelsPath)) ?? modelsArrayOf(readAt(view.value, modelsPath)) ?? []

    const plan: PlanResult = planRoute({
      route,
      models,
      mapping: table,
      catalog,
      requireCompleteMapping: input.requireCompleteMapping,
    })
    if (!plan.ok) {
      outcomes.push({ route, status: 'refused', applied: [], errors: plan.errors })
      continue
    }

    const changed = plan.applied.some((row) => row.filledFields.length > 0)
    if (input.dryRun === true) {
      outcomes.push({ route, status: 'dry-run', applied: plan.applied, errors: [] })
      continue
    }
    if (!changed) {
      outcomes.push({ route, status: 'unchanged', applied: plan.applied, errors: [] })
      continue
    }

    // Re-read the route and re-plan before writing, then write at the revision
    // that re-read came from. Planning once and writing later loses an edit made
    // in between — the plan is a whole-array `set`, so a model the operator added
    // by hand in that window would be silently dropped. Re-planning turns that
    // race into a refusal instead.
    const fresh = (settings.describe() ?? []).find((candidate) => candidate.ns === row.settingsNs) ?? view
    const freshModels =
      modelsArrayOf(readAt(fresh.user, modelsPath)) ?? modelsArrayOf(readAt(fresh.value, modelsPath)) ?? []
    const current: PlanResult = planRoute({
      route,
      models: freshModels,
      mapping: table,
      catalog,
      requireCompleteMapping: input.requireCompleteMapping,
    })
    if (!current.ok || modelsChanged(models, freshModels)) {
      outcomes.push(
        current.ok
          ? refuse(route, `route "${route}" changed while it was being filled — nothing was written`)
          : { route, status: 'refused', applied: [], errors: current.errors },
      )
      continue
    }

    const op: SettingsOp = { op: 'set', path: modelsPath, value: current.entries }
    try {
      await settings.mutate(row.settingsNs, [op], fresh.revision)
      outcomes.push({ route, status: 'applied', applied: current.applied, errors: [] })
    } catch (error) {
      outcomes.push({
        route,
        status: 'refused',
        applied: [],
        errors: [],
        reason: `settings write refused: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? (error.stack ?? error.message) : String(error),
      })
    }
  }

  return outcomes
}
