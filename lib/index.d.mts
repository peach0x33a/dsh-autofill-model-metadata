import { Context } from "cordis";
//#region src/core/types.d.ts
/** One model that was (or would be) filled. */
interface AppliedRow {
  modelId: string;
  source: string;
  /** The capability fields taken from the catalog, in write order. */
  filledFields: string[];
}
/** Why a plan refused to produce a models array. */
type PlanErrorKind = 'malformed-source' | 'unknown-provider' | 'unknown-model' | 'ambiguous-source' | 'not-agent-capable' | 'missing-mapping' | 'undeclared-mapping';
/** One reason a route's plan was refused. */
interface PlanError {
  kind: PlanErrorKind;
  message: string;
  /** Present for per-model errors. */
  modelId?: string;
}
//#endregion
//#region src/core/apply.d.ts
/** How one mapped route ended. */
type RouteStatus = 'applied' | 'dry-run' | 'unchanged' | 'refused';
/** One route's outcome. */
interface RouteOutcome {
  route: string;
  status: RouteStatus;
  /** One row per mapped model, with the fields the catalog supplied. */
  applied: AppliedRow[];
  /** Refusals, when `status` is `refused`. */
  errors: PlanError[];
  /** Why the route was refused before planning (missing route, namespace, …). */
  reason?: string;
  stack?: string;
}
//#endregion
//#region src/index.d.ts
/** Stable cordis plugin name. */
declare const name = "dsh-autofill-model-metadata";
/** The service this plugin composes over: the llm directory knows the routes. */
declare const inject: string[];
/**
 * The schema surface {@link Config} exposes.
 *
 * The concrete schemastery schema type is inferred through `Dict` types that
 * live under a pnpm-private path, which rollers of declaration files cannot
 * name portably (TS2742). Declaring the surface locally keeps the emitted
 * `.d.mts` portable while leaving the runtime object untouched.
 */
interface ConfigSchema {
  (value: unknown): Record<string, unknown>;
  toJSON(): unknown;
}
/**
 * Plugin configuration.
 *
 * Every field is volatile: the host renders this schema into the plugin's
 * settings form and applies an edit without remounting the entry.
 */
declare const Config: ConfigSchema;
/** How the plugin treats the host-generated settings form. */
type BuiltinSettingsFormPolicy = 'auto' | 'always' | 'never';
/** The live values of {@link Config}. */
interface ResolvedConfig {
  modelsDevUrl: string;
  cachePath: string;
  cacheTTLHours: number;
  applyOnStart: boolean;
  dryRun: boolean;
  requireCompleteMapping: boolean;
  builtinSettingsForm: BuiltinSettingsFormPolicy;
  mapping: Record<string, Record<string, string>>;
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
declare function resolveOwnEntryId(ctx: unknown): string | undefined;
/** `$DSH_HOME`, falling back to `~/.dsh` the way the host does. */
declare function dshHome(): string;
/** Resolve the live configuration, applying the schema defaults. */
declare function resolveConfig(config: unknown): ResolvedConfig;
/** One line per outcome, for the log and the endpoint answer. */
declare function formatOutcome(outcome: RouteOutcome): string;
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
declare function apply(ctx: Context, config: unknown): void;
//#endregion
export { BuiltinSettingsFormPolicy, Config, ConfigSchema, ResolvedConfig, apply, dshHome, formatOutcome, inject, name, resolveConfig, resolveOwnEntryId };