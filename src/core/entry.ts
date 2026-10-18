/**
 * models.dev model record → the capability fields an `llm-pi-ai` model entry
 * carries.
 *
 * The mapping mirrors the semantics of the pi extension this plugin ports
 * (`pi-autofill-model-metadata`), narrowed to the fields the DSH models
 * settings section actually exposes: display name, context window, output cap,
 * input modalities and thinking levels.
 *
 * @module dsh-autofill-model-metadata/entry
 */

import { THINKING_LEVELS, type Capabilities, type CatalogModel, type ModelInput } from './types.ts'

/** Levels that carry a wire value; `off` is special (see {@link effortsFromModel}). */
const WIRE_LEVELS = new Set<string>(['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])

/** Every level name the llm-pi-ai schema accepts. */
const LEVELS = new Set<string>(THINKING_LEVELS)

/**
 * Whether a models.dev record describes something an agent should drive.
 *
 * A record that cannot call tools — an image, embedding or speech endpoint —
 * must never be adopted as a chat route, and a deprecated record must not be
 * written back. A mapping that names one is a refusal, not a silent skip: the
 * operator pointed at the wrong row and has to know.
 *
 * @param model - one models.dev model record.
 * @returns true when the record is a live, tool-calling chat model.
 */
export function isAgentModel(model: CatalogModel | undefined): boolean {
  if (model === null || typeof model !== 'object') return false
  if (model.tool_call !== true) return false
  return model.status !== 'deprecated'
}

/** The effort values a model's `reasoning_options` declares (empty when none). */
export function effortValues(model: CatalogModel | undefined): string[] {
  const options = model?.reasoning_options
  if (!Array.isArray(options)) return []
  return options.flatMap((option) =>
    option !== null && typeof option === 'object' && option.type === 'effort' && Array.isArray(option.values)
      ? option.values.filter((value): value is string => typeof value === 'string')
      : [],
  )
}

/**
 * One model's `reasoningEfforts` declaration.
 *
 * - `reasoning: false` → `false` (a model that does not think at all);
 * - declared effort values → a level map, with the endpoint's own `none` landing
 *   on the `off` level so choosing "off" sends the value the endpoint expects;
 * - values that name no known level, or none at all (`toggle` / `budget_tokens`
 *   only) → `undefined`, which leaves the installed catalog's declaration alone;
 * - a declaration offering nothing beyond `off` → `false`, because the schema
 *   rejects an efforts map with no real level.
 *
 * @param model - one models.dev model record.
 * @returns the declaration, `false`, or `undefined` to inherit.
 */
export function effortsFromModel(model: CatalogModel | undefined): Capabilities['reasoningEfforts'] {
  if (model?.reasoning === false) return false
  const declared = effortValues(model).filter((value) => value === 'none' || WIRE_LEVELS.has(value))
  if (declared.length === 0) return undefined
  const efforts: Record<string, string> = {}
  for (const value of declared) {
    if (value === 'none') efforts.off = value
    else if (LEVELS.has(value)) efforts[value] = value
  }
  if (!Object.keys(efforts).some((level) => level !== 'off')) return false
  return efforts
}

/**
 * The capability fields one models.dev record contributes.
 *
 * `undefined` fields mean "the catalog says nothing" and are never written.
 * Non-positive limits are treated as absent: models.dev publishes `limit: 0` for
 * endpoints that do not take text at all, and the llm-pi-ai schema requires
 * `contextWindow`/`maxTokens` to be at least 1.
 *
 * @param model - one models.dev model record.
 * @returns the capabilities, or null when the record is not an agent model.
 */
export function capabilitiesFromModel(model: CatalogModel | undefined): Capabilities | null {
  if (!isAgentModel(model)) return null
  const capabilities: Capabilities = {}

  if (typeof model?.name === 'string' && model.name.trim().length > 0) capabilities.name = model.name

  const context = model?.limit?.context
  if (typeof context === 'number' && Number.isFinite(context) && context > 0) {
    capabilities.contextWindow = context
  }
  const output = model?.limit?.output
  if (typeof output === 'number' && Number.isFinite(output) && output > 0) {
    capabilities.maxTokens = output
  }

  const declaredInput = model?.modalities?.input
  if (Array.isArray(declaredInput)) {
    const input: ModelInput[] = declaredInput.includes('image') ? ['text', 'image'] : ['text']
    capabilities.input = input
  }

  const efforts = effortsFromModel(model)
  if (efforts !== undefined) capabilities.reasoningEfforts = efforts

  return capabilities
}
