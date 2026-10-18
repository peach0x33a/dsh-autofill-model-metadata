/**
 * Fail-closed route planning: one route's declared models + the explicit mapping
 * + the catalog → the next `models` array, or the reasons it was refused.
 *
 * The contract (ported from `pi-autofill-model-metadata`):
 *
 *   - every model the route declares must be mapped, unless the operator turned
 *     completeness off — a mapping that covers half a route is how models
 *     silently lose their capabilities;
 *   - a mapping may not name a model the route does not declare: that is a typo,
 *     and a typo must be loud;
 *   - every source must resolve inside the models.dev provider it names;
 *   - **one unresolved source refuses the whole route.** No partial write is ever
 *     handed back, so a spelling mistake can never half-apply a route.
 *
 * A declared field always wins over the catalog. The plugin only fills what the
 * entry leaves undefined, so hand-edited windows, names and thinking levels are
 * never overwritten.
 *
 * @module dsh-autofill-model-metadata/plan
 */

import { capabilitiesFromModel } from './entry.ts'
import { resolveSource } from './source.ts'
import type { AppliedRow, Catalog, Capabilities, ModelEntry, PlanError } from './types.ts'

/** One route's planning input. */
export interface PlanInput {
  /** The route key the operator wrote in `mapping`. */
  route: string
  /** The route's currently declared `models` entries. */
  models: ModelEntry[]
  /** The route's explicit `<modelId> → "<provider>/<model>"` mapping. */
  mapping: Record<string, string>
  /** One models.dev payload. */
  catalog: Catalog | undefined
  /**
   * When true (the default) every declared model needs a mapping. When false,
   * unmapped models are simply left untouched — but a mapping that names an
   * undeclared model is still refused.
   */
  requireCompleteMapping?: boolean
}

/** The plan for one route. `entries` is only writable when `ok` is true. */
export interface PlanResult {
  ok: boolean
  entries: ModelEntry[]
  applied: AppliedRow[]
  errors: PlanError[]
}

/** How one declared model stands against the mapping and the catalog. */
export type ModelState =
  /** Mapped, resolvable, and at least one field would be filled. */
  | 'filled'
  /** Mapped and resolvable, but the profile already declares every field. */
  | 'unchanged'
  /** No mapping entry: left untouched (and a refusal when completeness is on). */
  | 'unmapped'
  /** Mapped, but the source does not resolve to a live tool-calling chat model. */
  | 'invalid'

/** One declared model, as the settings page needs to show it. */
export interface ModelInspection {
  id: string
  /** Fields the profile already declares (`!== undefined`), in write order. */
  declared: string[]
  /** The declared `mapping.<route>.<id>` value, when there is one. */
  source?: string
  state: ModelState
  /** Catalog values a pass would add, keyed by field. */
  filled: Record<string, unknown>
  /** The refusal this model contributes, when it contributes one. */
  error?: PlanError
}

/** One route's read-only report: everything a settings page renders. */
export interface RouteInspection {
  route: string
  /** One entry per declared model, in declaration order. */
  models: ModelInspection[]
  /** Mapping keys that name a model the route does not declare. */
  orphans: string[]
  /** Every refusal, in the order {@link planRoute} reports them. */
  errors: PlanError[]
  /** The next `models` array (patched), before the refusal check. */
  entries: ModelEntry[]
  /** One row per mapped model that resolves. */
  applied: AppliedRow[]
}

/** The fields the catalog may fill, in write order. */
const FILLABLE = ['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts'] as const

/** Merge catalog capabilities into one declared entry, never overwriting it. */
export function mergeCapabilities(
  entry: ModelEntry,
  capabilities: Capabilities,
): { entry: ModelEntry; filledFields: string[] } {
  const merged: ModelEntry = { ...entry }
  const filledFields: string[] = []
  for (const field of FILLABLE) {
    if (merged[field] !== undefined) continue
    const value = capabilities[field]
    if (value === undefined) continue
    merged[field] = value
    filledFields.push(field)
  }
  return { entry: merged, filledFields }
}

/** The non-empty string ids of a route's declared models, in declaration order. */
function declaredIds(models: ModelEntry[]): string[] {
  return models
    .map((entry) => entry?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

/**
 * Inspect one route: per declared model, what the mapping and catalog say.
 *
 * This is the single place the routing rules live — {@link planRoute} is a thin
 * projection of it, so a settings page that previews a route and a pass that
 * writes it can never disagree.
 *
 * @param input - the route, its declared models, its mapping and the catalog.
 * @returns the inspection, including refusals in plan order.
 */
export function inspectRoute(input: PlanInput): RouteInspection {
  const { route, models, mapping, catalog } = input
  const complete = input.requireCompleteMapping !== false
  const declared = declaredIds(models)
  const declaredSet = new Set(declared)
  const errors: PlanError[] = []

  // 1. Declared models with no mapping. Refused only when completeness is on.
  for (const modelId of declared) {
    if (mapping[modelId] !== undefined) continue
    if (!complete) continue
    errors.push({
      kind: 'missing-mapping',
      modelId,
      message: `model "${modelId}" of route "${route}" has no entry in mapping.${route}`,
    })
  }

  // 2. Mapping keys that name a model the route does not declare: always refused.
  const orphans: string[] = []
  for (const modelId of Object.keys(mapping)) {
    if (declaredSet.has(modelId)) continue
    orphans.push(modelId)
    errors.push({
      kind: 'undeclared-mapping',
      modelId,
      message: `mapping.${route} names "${modelId}", which route "${route}" does not declare`,
    })
  }

  // 3. Per-model resolution, in mapping order.
  const perModel = new Map<string, ModelInspection>()
  const applied: AppliedRow[] = []
  const patched = new Map<string, ModelEntry>()
  for (const [modelId, source] of Object.entries(mapping)) {
    if (!declaredSet.has(modelId)) continue
    const current = models.find((entry) => entry?.id === modelId)
    if (current === undefined) continue
    const declaredFields = FILLABLE.filter((field) => current[field] !== undefined)
    const unresolved = (error: PlanError, state: ModelState): void => {
      errors.push({ ...error, modelId })
      perModel.set(modelId, { id: modelId, declared: declaredFields, source, state, filled: {}, error: { ...error, modelId } })
    }

    const resolved = resolveSource(catalog, source)
    if (!resolved.ok) {
      unresolved(resolved.error, 'invalid')
      continue
    }
    const capabilities = capabilitiesFromModel(resolved.model)
    if (capabilities === null) {
      unresolved(
        {
          kind: 'not-agent-capable',
          message:
            `source "${source}" resolved to a models.dev record that is not a live tool-calling ` +
            `chat model (tool_call=${String(resolved.model.tool_call)}, status=${String(resolved.model.status)})`,
        },
        'invalid',
      )
      continue
    }

    const { entry, filledFields } = mergeCapabilities(current, capabilities)
    patched.set(modelId, entry)
    applied.push({ modelId, source, filledFields })
    const filled: Record<string, unknown> = {}
    for (const field of filledFields) filled[field] = entry[field]
    perModel.set(modelId, {
      id: modelId,
      declared: declaredFields,
      source,
      state: filledFields.length > 0 ? 'filled' : 'unchanged',
      filled,
    })
  }

  const report: ModelInspection[] = declared.map(
    (modelId) =>
      perModel.get(modelId) ?? {
        id: modelId,
        declared: FILLABLE.filter(
          (field) => models.find((entry) => entry?.id === modelId)?.[field] !== undefined,
        ),
        state: 'unmapped' as const,
        filled: {},
      },
  )

  // Keep the operator's declaration order: patch in place, never reorder.
  return {
    route,
    models: report,
    orphans,
    errors,
    entries: models.map((entry) => patched.get(entry?.id) ?? entry),
    applied,
  }
}

/**
 * Plan one route's next `models` array.
 *
 * @param input - the route, its declared models, its mapping and the catalog.
 * @returns the plan; `ok: false` means "write nothing".
 */
export function planRoute(input: PlanInput): PlanResult {
  const inspection = inspectRoute(input)
  if (inspection.errors.length > 0) return { ok: false, entries: input.models, applied: [], errors: inspection.errors }
  return { ok: true, entries: inspection.entries, applied: inspection.applied, errors: [] }
}
