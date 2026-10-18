/**
 * Explicit source resolution: `"<models.dev provider>/<models.dev model>"` → one
 * catalog record.
 *
 * This is the heart of the plugin's contract. A source is never guessed: the
 * configured string names the provider and the model, and only that provider's
 * records are searched. A name that does not resolve — or that resolves to more
 * than one record once case is ignored — fails the whole route rather than
 * picking a "best" candidate, because a wrong pick silently writes another
 * vendor's context window onto the route.
 *
 * @module dsh-autofill-model-metadata/source
 */

import type { Catalog, CatalogModel, PlanError, PlanErrorKind, SourceRef } from './types.ts'

/** A parsed source string. */
export interface ParsedSource {
  providerId: string
  modelId: string
}

/** The outcome of resolving one source against one catalog. */
export type ResolveResult =
  | { ok: true; ref: SourceRef; model: CatalogModel }
  | { ok: false; error: PlanError }

/** Build one refusal. */
function refuse(kind: PlanErrorKind, message: string): ResolveResult {
  return { ok: false, error: { kind, message } }
}

/**
 * Split one source string into its provider and model halves.
 *
 * The split happens at the **first** slash, so model ids that themselves contain
 * slashes (models.dev has a few, e.g. `workers-ai/@cf/...`) stay intact.
 *
 * @param source - the configured string.
 * @returns the halves, or null when the string is not `<provider>/<model>`.
 */
export function parseSource(source: unknown): ParsedSource | null {
  if (typeof source !== 'string') return null
  const slash = source.indexOf('/')
  if (slash <= 0 || slash === source.length - 1) return null
  const providerId = source.slice(0, slash)
  const modelId = source.slice(slash + 1)
  if (providerId.trim().length === 0 || modelId.trim().length === 0) return null
  // "provider//" splits into an all-slash model half: not a model id.
  if (/^\/+$/.test(modelId)) return null
  return { providerId, modelId }
}

/** One provider's model records, paired with the id they answer to. */
function recordsOf(models: Record<string, CatalogModel> | undefined): Array<{ id: string; model: CatalogModel }> {
  if (models === null || typeof models !== 'object' || Array.isArray(models)) return []
  const records: Array<{ id: string; model: CatalogModel }> = []
  for (const [key, model] of Object.entries(models)) {
    if (model === null || typeof model !== 'object' || Array.isArray(model)) continue
    const declared = typeof model.id === 'string' && model.id.length > 0 ? model.id : key
    records.push({ id: declared, model })
  }
  return records
}

/**
 * Resolve one source string against the catalog.
 *
 * Resolution is deliberately narrow:
 *   1. the provider must exist — there is no cross-provider search;
 *   2. an exact model id match wins;
 *   3. otherwise a case-insensitive match is accepted **only when it is unique**;
 *   4. any other outcome is a refusal naming what failed.
 *
 * @param catalog - one models.dev `api.json` payload.
 * @param source - the configured `<provider>/<model>` string.
 * @returns the resolved record and its audit ref, or the refusal.
 */
export function resolveSource(catalog: Catalog | undefined, source: string): ResolveResult {
  const parsed = parseSource(source)
  if (parsed === null) {
    return refuse(
      'malformed-source',
      `source "${source}" is not a "models.dev-provider/models.dev-model" path`,
    )
  }

  const provider = catalog?.[parsed.providerId]
  if (provider === null || typeof provider !== 'object') {
    return refuse(
      'unknown-provider',
      `models.dev has no provider "${parsed.providerId}" (source "${source}")`,
    )
  }

  const records = recordsOf(provider.models)
  const exact = records.find((record) => record.id === parsed.modelId)
  const match =
    exact ??
    (() => {
      const folded = records.filter(
        (record) => record.id.toLowerCase() === parsed.modelId.toLowerCase(),
      )
      return folded.length === 1 ? folded[0] : undefined
    })()

  if (match === undefined) {
    const near = records
      .filter((record) => record.id.toLowerCase() === parsed.modelId.toLowerCase())
      .map((record) => record.id)
    if (near.length > 1) {
      return refuse(
        'ambiguous-source',
        `source "${source}" matches ${near.length} models.dev records (${near.join(', ')}) — ` +
          'spell the model id exactly',
      )
    }
    return refuse(
      'unknown-model',
      `models.dev provider "${parsed.providerId}" has no model "${parsed.modelId}" (source "${source}")`,
    )
  }

  return {
    ok: true,
    model: match.model,
    ref: {
      source,
      providerId: parsed.providerId,
      requestedModelId: parsed.modelId,
      resolvedModelId: match.id,
    },
  }
}
