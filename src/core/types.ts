/**
 * Shared vocabulary for the explicit models.dev mapping plugin.
 *
 * Everything here is structural: the plugin never imports dsh internals, so the
 * host seams it talks to (`settings`, `llm`) are described by the shapes those
 * services are known to expose on dsh 0.2.0-rc.2 rather than by their classes.
 *
 * @module dsh-autofill-model-metadata/types
 */

/** The modalities `llm-pi-ai` accepts in a model entry's `input`. */
export type ModelInput = 'text' | 'image'

/** The thinking levels `llm-pi-ai` accepts as `reasoningEfforts` keys. */
export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

/** One accepted thinking level. */
export type ThinkingLevel = (typeof THINKING_LEVELS)[number]

/**
 * One model's `reasoningEfforts` declaration: level → the wire value to send.
 * `null` means "send the level's own name"; `off` is the special no-thinking
 * level and is the only level allowed to carry a non-null alias (`none`).
 */
export type ReasoningEfforts = Partial<Record<ThinkingLevel, string | null>>

/** One `reasoning_options` entry of a models.dev model record. */
export interface CatalogReasoningOption {
  type?: string
  values?: Array<string | null>
  default?: string | null
  min?: number
  max?: number
}

/** One models.dev model record (only the fields this plugin reads). */
export interface CatalogModel {
  id?: string
  name?: string
  tool_call?: boolean
  status?: string
  reasoning?: boolean
  reasoning_options?: CatalogReasoningOption[]
  modalities?: { input?: string[]; output?: string[] }
  limit?: { context?: number; input?: number; output?: number }
  [field: string]: unknown
}

/** One models.dev provider record (only the fields this plugin reads). */
export interface CatalogProvider {
  id?: string
  name?: string
  npm?: string
  api?: string
  models?: Record<string, CatalogModel>
  [field: string]: unknown
}

/** The whole models.dev `api.json` payload, keyed by provider id. */
export type Catalog = Record<string, CatalogProvider>

/**
 * The capability fields this plugin writes into a `models` entry. An absent
 * field means "this plugin has no opinion" — a declared value is never removed.
 */
export interface Capabilities {
  name?: string
  contextWindow?: number
  maxTokens?: number
  input?: ModelInput[]
  reasoningEfforts?: ReasoningEfforts | false
}

/** One `providers.<route>.models[]` entry; unknown fields pass through untouched. */
export interface ModelEntry {
  id: string
  [field: string]: unknown
}

/** Where one mapped model's metadata came from (the audit trail). */
export interface SourceRef {
  /** The configured string, verbatim: `<models.dev provider>/<models.dev model>`. */
  source: string
  /** The models.dev provider id the source names. */
  providerId: string
  /** The model id the source names. */
  requestedModelId: string
  /** The model id the catalog actually resolved to (differs only by case). */
  resolvedModelId: string
}

/** One model that was (or would be) filled. */
export interface AppliedRow {
  modelId: string
  source: string
  /** The capability fields taken from the catalog, in write order. */
  filledFields: string[]
}

/** Why a plan refused to produce a models array. */
export type PlanErrorKind =
  | 'malformed-source'
  | 'unknown-provider'
  | 'unknown-model'
  | 'ambiguous-source'
  | 'not-agent-capable'
  | 'missing-mapping'
  | 'undeclared-mapping'

/** One reason a route's plan was refused. */
export interface PlanError {
  kind: PlanErrorKind
  message: string
  /** Present for per-model errors. */
  modelId?: string
}

/** The `settings` service seam as this plugin uses it. */
export interface SettingsView {
  ns: string
  revision: number
  value?: unknown
  user?: unknown
}

/** One settings path operation. */
export interface SettingsOp {
  op: 'set' | 'unset'
  path: string[]
  value?: unknown
}

/** The `settings` service seam as this plugin uses it. */
export interface SettingsSeam {
  describe(): SettingsView[]
  mutate(ns: string, ops: SettingsOp[], revision: number): Promise<unknown>
  /**
   * Declare this instance's automatic-form policy. `{ auto: false }` tells the
   * host that the plugin ships its own settings page, so the schema-derived form
   * is not generated as well. Returns the disposer the caller must register.
   */
  configure?(presentation: { auto?: boolean }, owner?: unknown): () => void
  /** The live config the seam is bound to, when the host exposes it. */
  readonly writable?: boolean
  readonly documentPath?: string
}

/** One configurable-provider directory row (`llm.listConfigurableProviders`). */
export interface ProviderRow {
  provider: string
  displayName?: string
  settingsNs: string
  settingsPath?: string[]
  declared?: boolean
  error?: string
}
