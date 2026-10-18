import { appendFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import z from "@deepseek-ai/schemastery";
//#region src/core/types.ts
/** The thinking levels `llm-pi-ai` accepts as `reasoningEfforts` keys. */
const THINKING_LEVELS = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
];
//#endregion
//#region src/core/entry.ts
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
/** Levels that carry a wire value; `off` is special (see {@link effortsFromModel}). */
const WIRE_LEVELS = /* @__PURE__ */ new Set([
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
]);
/** Every level name the llm-pi-ai schema accepts. */
const LEVELS = new Set(THINKING_LEVELS);
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
function isAgentModel(model) {
	if (model === null || typeof model !== "object") return false;
	if (model.tool_call !== true) return false;
	return model.status !== "deprecated";
}
/** The effort values a model's `reasoning_options` declares (empty when none). */
function effortValues(model) {
	const options = model?.reasoning_options;
	if (!Array.isArray(options)) return [];
	return options.flatMap((option) => option !== null && typeof option === "object" && option.type === "effort" && Array.isArray(option.values) ? option.values.filter((value) => typeof value === "string") : []);
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
function effortsFromModel(model) {
	if (model?.reasoning === false) return false;
	const declared = effortValues(model).filter((value) => value === "none" || WIRE_LEVELS.has(value));
	if (declared.length === 0) return void 0;
	const efforts = {};
	for (const value of declared) if (value === "none") efforts.off = value;
	else if (LEVELS.has(value)) efforts[value] = value;
	if (!Object.keys(efforts).some((level) => level !== "off")) return false;
	return efforts;
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
function capabilitiesFromModel(model) {
	if (!isAgentModel(model)) return null;
	const capabilities = {};
	if (typeof model?.name === "string" && model.name.trim().length > 0) capabilities.name = model.name;
	const context = model?.limit?.context;
	if (typeof context === "number" && Number.isFinite(context) && context > 0) capabilities.contextWindow = context;
	const output = model?.limit?.output;
	if (typeof output === "number" && Number.isFinite(output) && output > 0) capabilities.maxTokens = output;
	const declaredInput = model?.modalities?.input;
	if (Array.isArray(declaredInput)) capabilities.input = declaredInput.includes("image") ? ["text", "image"] : ["text"];
	const efforts = effortsFromModel(model);
	if (efforts !== void 0) capabilities.reasoningEfforts = efforts;
	return capabilities;
}
//#endregion
//#region src/core/source.ts
/** Build one refusal. */
function refuse$1(kind, message) {
	return {
		ok: false,
		error: {
			kind,
			message
		}
	};
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
function parseSource(source) {
	if (typeof source !== "string") return null;
	const slash = source.indexOf("/");
	if (slash <= 0 || slash === source.length - 1) return null;
	const providerId = source.slice(0, slash);
	const modelId = source.slice(slash + 1);
	if (providerId.trim().length === 0 || modelId.trim().length === 0) return null;
	if (/^\/+$/.test(modelId)) return null;
	return {
		providerId,
		modelId
	};
}
/** One provider's model records, paired with the id they answer to. */
function recordsOf(models) {
	if (models === null || typeof models !== "object" || Array.isArray(models)) return [];
	const records = [];
	for (const [key, model] of Object.entries(models)) {
		if (model === null || typeof model !== "object" || Array.isArray(model)) continue;
		const declared = typeof model.id === "string" && model.id.length > 0 ? model.id : key;
		records.push({
			id: declared,
			model
		});
	}
	return records;
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
function resolveSource(catalog, source) {
	const parsed = parseSource(source);
	if (parsed === null) return refuse$1("malformed-source", `source "${source}" is not a "models.dev-provider/models.dev-model" path`);
	const provider = catalog?.[parsed.providerId];
	if (provider === null || typeof provider !== "object") return refuse$1("unknown-provider", `models.dev has no provider "${parsed.providerId}" (source "${source}")`);
	const records = recordsOf(provider.models);
	const match = records.find((record) => record.id === parsed.modelId) ?? (() => {
		const folded = records.filter((record) => record.id.toLowerCase() === parsed.modelId.toLowerCase());
		return folded.length === 1 ? folded[0] : void 0;
	})();
	if (match === void 0) {
		const near = records.filter((record) => record.id.toLowerCase() === parsed.modelId.toLowerCase()).map((record) => record.id);
		if (near.length > 1) return refuse$1("ambiguous-source", `source "${source}" matches ${near.length} models.dev records (${near.join(", ")}) — spell the model id exactly`);
		return refuse$1("unknown-model", `models.dev provider "${parsed.providerId}" has no model "${parsed.modelId}" (source "${source}")`);
	}
	return {
		ok: true,
		model: match.model,
		ref: {
			source,
			providerId: parsed.providerId,
			requestedModelId: parsed.modelId,
			resolvedModelId: match.id
		}
	};
}
//#endregion
//#region src/core/plan.ts
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
/** The fields the catalog may fill, in write order. */
const FILLABLE = [
	"name",
	"contextWindow",
	"maxTokens",
	"input",
	"reasoningEfforts"
];
/** Merge catalog capabilities into one declared entry, never overwriting it. */
function mergeCapabilities(entry, capabilities) {
	const merged = { ...entry };
	const filledFields = [];
	for (const field of FILLABLE) {
		if (merged[field] !== void 0) continue;
		const value = capabilities[field];
		if (value === void 0) continue;
		merged[field] = value;
		filledFields.push(field);
	}
	return {
		entry: merged,
		filledFields
	};
}
/** The non-empty string ids of a route's declared models, in declaration order. */
function declaredIds(models) {
	return models.map((entry) => entry?.id).filter((id) => typeof id === "string" && id.length > 0);
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
function inspectRoute(input) {
	const { route, models, mapping, catalog } = input;
	const complete = input.requireCompleteMapping !== false;
	const declared = declaredIds(models);
	const declaredSet = new Set(declared);
	const errors = [];
	for (const modelId of declared) {
		if (mapping[modelId] !== void 0) continue;
		if (!complete) continue;
		errors.push({
			kind: "missing-mapping",
			modelId,
			message: `model "${modelId}" of route "${route}" has no entry in mapping.${route}`
		});
	}
	const orphans = [];
	for (const modelId of Object.keys(mapping)) {
		if (declaredSet.has(modelId)) continue;
		orphans.push(modelId);
		errors.push({
			kind: "undeclared-mapping",
			modelId,
			message: `mapping.${route} names "${modelId}", which route "${route}" does not declare`
		});
	}
	const perModel = /* @__PURE__ */ new Map();
	const applied = [];
	const patched = /* @__PURE__ */ new Map();
	for (const [modelId, source] of Object.entries(mapping)) {
		if (!declaredSet.has(modelId)) continue;
		const current = models.find((entry) => entry?.id === modelId);
		if (current === void 0) continue;
		const declaredFields = FILLABLE.filter((field) => current[field] !== void 0);
		const unresolved = (error, state) => {
			errors.push({
				...error,
				modelId
			});
			perModel.set(modelId, {
				id: modelId,
				declared: declaredFields,
				source,
				state,
				filled: {},
				error: {
					...error,
					modelId
				}
			});
		};
		const resolved = resolveSource(catalog, source);
		if (!resolved.ok) {
			unresolved(resolved.error, "invalid");
			continue;
		}
		const capabilities = capabilitiesFromModel(resolved.model);
		if (capabilities === null) {
			unresolved({
				kind: "not-agent-capable",
				message: `source "${source}" resolved to a models.dev record that is not a live tool-calling chat model (tool_call=${String(resolved.model.tool_call)}, status=${String(resolved.model.status)})`
			}, "invalid");
			continue;
		}
		const { entry, filledFields } = mergeCapabilities(current, capabilities);
		patched.set(modelId, entry);
		applied.push({
			modelId,
			source,
			filledFields
		});
		const filled = {};
		for (const field of filledFields) filled[field] = entry[field];
		perModel.set(modelId, {
			id: modelId,
			declared: declaredFields,
			source,
			state: filledFields.length > 0 ? "filled" : "unchanged",
			filled
		});
	}
	return {
		route,
		models: declared.map((modelId) => perModel.get(modelId) ?? {
			id: modelId,
			declared: FILLABLE.filter((field) => models.find((entry) => entry?.id === modelId)?.[field] !== void 0),
			state: "unmapped",
			filled: {}
		}),
		orphans,
		errors,
		entries: models.map((entry) => patched.get(entry?.id) ?? entry),
		applied
	};
}
/**
* Plan one route's next `models` array.
*
* @param input - the route, its declared models, its mapping and the catalog.
* @returns the plan; `ok: false` means "write nothing".
*/
function planRoute(input) {
	const inspection = inspectRoute(input);
	if (inspection.errors.length > 0) return {
		ok: false,
		entries: input.models,
		applied: [],
		errors: inspection.errors
	};
	return {
		ok: true,
		entries: inspection.entries,
		applied: inspection.applied,
		errors: []
	};
}
//#endregion
//#region src/core/apply.ts
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
/** The settings namespace whose provider profiles this plugin fills. */
const TARGET_NS = "llm-pi-ai";
/** Read one path inside a settings layer; undefined when the path is absent. */
function readAt(value, path) {
	let current = value;
	for (const key of path) {
		if (current === null || typeof current !== "object") return void 0;
		current = current[key];
	}
	return current;
}
/** The `models` entries of one layer value: objects carrying a non-empty id. */
function modelsArrayOf(value) {
	if (!Array.isArray(value)) return void 0;
	return value.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item) && typeof item.id === "string" && item.id.length > 0);
}
/** One refusal raised before planning could run. */
function refuse(route, reason) {
	return {
		route,
		status: "refused",
		applied: [],
		errors: [],
		reason
	};
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
function modelsChanged(before, after) {
	if (before.length !== after.length) return true;
	return before.some((entry, index) => {
		const other = after[index];
		if (entry?.id !== other?.id) return true;
		return JSON.stringify(entry) !== JSON.stringify(other);
	});
}
async function applyRoutes(input) {
	const { settings, providers, mapping, catalog } = input;
	const routes = Object.keys(mapping ?? {});
	const outcomes = [];
	for (const route of routes) {
		const table = mapping[route] ?? {};
		const row = (providers ?? []).find((candidate) => candidate?.settingsNs === "llm-pi-ai" && candidate.provider === route);
		if (row === void 0) {
			outcomes.push(refuse(route, `route "${route}" is not a configurable provider of ${TARGET_NS}`));
			continue;
		}
		const view = (settings.describe() ?? []).find((candidate) => candidate.ns === row.settingsNs);
		if (view === void 0) {
			outcomes.push(refuse(route, `settings namespace "${row.settingsNs}" is not registered`));
			continue;
		}
		const routePath = row.settingsPath ?? [];
		const modelsPath = [...routePath, "models"];
		if (readAt(view.value, routePath) === void 0) {
			outcomes.push(refuse(route, `route "${route}" is not configured in ${row.settingsNs}`));
			continue;
		}
		const models = modelsArrayOf(readAt(view.user, modelsPath)) ?? modelsArrayOf(readAt(view.value, modelsPath)) ?? [];
		const plan = planRoute({
			route,
			models,
			mapping: table,
			catalog,
			requireCompleteMapping: input.requireCompleteMapping
		});
		if (!plan.ok) {
			outcomes.push({
				route,
				status: "refused",
				applied: [],
				errors: plan.errors
			});
			continue;
		}
		const changed = plan.applied.some((row) => row.filledFields.length > 0);
		if (input.dryRun === true) {
			outcomes.push({
				route,
				status: "dry-run",
				applied: plan.applied,
				errors: []
			});
			continue;
		}
		if (!changed) {
			outcomes.push({
				route,
				status: "unchanged",
				applied: plan.applied,
				errors: []
			});
			continue;
		}
		const fresh = (settings.describe() ?? []).find((candidate) => candidate.ns === row.settingsNs) ?? view;
		const freshModels = modelsArrayOf(readAt(fresh.user, modelsPath)) ?? modelsArrayOf(readAt(fresh.value, modelsPath)) ?? [];
		const current = planRoute({
			route,
			models: freshModels,
			mapping: table,
			catalog,
			requireCompleteMapping: input.requireCompleteMapping
		});
		if (!current.ok || modelsChanged(models, freshModels)) {
			outcomes.push(current.ok ? refuse(route, `route "${route}" changed while it was being filled — nothing was written`) : {
				route,
				status: "refused",
				applied: [],
				errors: current.errors
			});
			continue;
		}
		const op = {
			op: "set",
			path: modelsPath,
			value: current.entries
		};
		try {
			await settings.mutate(row.settingsNs, [op], fresh.revision);
			outcomes.push({
				route,
				status: "applied",
				applied: current.applied,
				errors: []
			});
		} catch (error) {
			outcomes.push({
				route,
				status: "refused",
				applied: [],
				errors: [],
				reason: `settings write refused: ${error instanceof Error ? error.message : String(error)}`,
				stack: error instanceof Error ? error.stack ?? error.message : String(error)
			});
		}
	}
	return outcomes;
}
//#endregion
//#region src/core/catalog.ts
/**
* The models.dev catalog reader: one TTL-cached `api.json` read, with an
* offline fallback to the last structurally valid copy.
*
* Download failure is never fatal when a previous copy exists — the plugin keeps
* working against the last good catalog and says so (`stale: true`), which is
* what makes an offline machine usable. The cache write is atomic (temp file +
* rename), so an interrupted process cannot leave a half-written catalog that
* the next start would reject.
*
* @module dsh-autofill-model-metadata/catalog
*/
/** Whether one value is a plain object (not null, not an array). */
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Validate a decoded models.dev payload, or throw naming what is wrong.
*
* Only the structure this plugin reads is checked, so a catalog that adds
* providers and fields stays usable: the root must key providers, and every
* provider's `models` — when present — must be an object.
*
* @param raw - the decoded payload.
* @returns the payload, typed.
* @throws Error when the payload is not a models.dev catalog.
*/
function validateCatalog(raw) {
	if (!isPlainObject(raw)) throw new Error("models.dev payload is not an object");
	if (Object.keys(raw).length === 0) throw new Error("models.dev payload declares no providers");
	for (const [providerId, provider] of Object.entries(raw)) {
		if (!isPlainObject(provider)) throw new Error(`models.dev provider "${providerId}" is not an object`);
		const models = provider.models;
		if (models !== void 0 && !isPlainObject(models)) throw new Error(`models.dev provider "${providerId}" has a non-object "models"`);
	}
	return raw;
}
/** The TTL-cached models.dev reader. */
var CatalogStore = class {
	options;
	constructor(options) {
		this.options = options;
	}
	/** Parse the cache file; undefined when absent, unreadable or invalid. */
	readCache() {
		try {
			const raw = JSON.parse(readFileSync(this.options.cachePath, "utf8"));
			if (!isPlainObject(raw)) return void 0;
			const { fetchedAt, url, data } = raw;
			if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) return void 0;
			return {
				fetchedAt,
				url: typeof url === "string" ? url : "",
				data: validateCatalog(data)
			};
		} catch {
			return;
		}
	}
	/** Write the cache atomically (temp + rename), best effort. */
	writeCache(envelope) {
		try {
			mkdirSync(dirname(this.options.cachePath), { recursive: true });
			const temp = join(dirname(this.options.cachePath), `.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`);
			writeFileSync(temp, JSON.stringify(envelope));
			renameSync(temp, this.options.cachePath);
		} catch (error) {
			this.options.logger?.warn?.(`dsh-autofill-model-metadata: cannot cache the models.dev catalog at ${this.options.cachePath} (${error instanceof Error ? error.message : String(error)})`);
		}
	}
	/**
	* Read the catalog, from the network when the cache is absent or expired.
	*
	* @param options.force - ignore the cache lifetime and refetch.
	* @returns the payload plus how it was obtained.
	* @throws Error when the network fails and no cached copy exists.
	*/
	async load(options = {}) {
		const cached = this.readCache();
		const fresh = cached !== void 0 && options.force !== true && this.options.ttlMs > 0 && Date.now() - cached.fetchedAt < this.options.ttlMs;
		if (cached !== void 0 && fresh) return {
			data: cached.data,
			stale: false,
			fromCache: true,
			fetchedAt: cached.fetchedAt
		};
		const fetchImpl = this.options.fetchImpl ?? fetch;
		try {
			const response = await fetchImpl(this.options.url);
			if (response.ok !== true) throw new Error(`${this.options.url} answered HTTP ${response.status}`);
			const data = validateCatalog(await response.json());
			const fetchedAt = Date.now();
			this.writeCache({
				fetchedAt,
				url: this.options.url,
				data
			});
			return {
				data,
				stale: false,
				fromCache: false,
				fetchedAt
			};
		} catch (error) {
			if (cached !== void 0) {
				this.options.logger?.warn?.(`dsh-autofill-model-metadata: models.dev unreachable — serving the cached catalog from ${new Date(cached.fetchedAt).toISOString()} (${error instanceof Error ? error.message : String(error)})`);
				return {
					data: cached.data,
					stale: true,
					fromCache: true,
					fetchedAt: cached.fetchedAt
				};
			}
			throw error;
		}
	}
};
//#endregion
//#region src/core/inspect.ts
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
/**
* Count the states of one route's models.
*
* `mapped` counts entries whose presence is known but not yet resolved: that
* only happens when the report ran without a catalog, and it must not be
* confused with `unmapped`, which is a real gap the operator has to close.
*/
function countStates(models) {
	const counts = {
		models: models.length,
		mapped: 0,
		filled: 0,
		unchanged: 0,
		unmapped: 0,
		invalid: 0
	};
	for (const model of models) if (model.state === "filled") counts.filled += 1;
	else if (model.state === "unchanged") counts.unchanged += 1;
	else if (model.state === "invalid") counts.invalid += 1;
	else if (model.state === "mapped") counts.mapped += 1;
	else counts.unmapped += 1;
	return counts;
}
/** Project the planner's per-model inspection into the page's shape. */
function project(inspection) {
	return {
		id: inspection.id,
		declared: inspection.declared,
		source: inspection.source,
		state: inspection.state,
		filled: inspection.filled,
		error: inspection.error
	};
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
function reportRoutes(input) {
	const { settings, providers, mapping, catalog } = input;
	const views = settings.describe() ?? [];
	const reports = [];
	const seen = /* @__PURE__ */ new Set();
	for (const row of providers ?? []) {
		if (row?.settingsNs !== "llm-pi-ai" || typeof row.provider !== "string") continue;
		const route = row.provider;
		seen.add(route);
		const table = mapping[route] ?? {};
		const mapped = Object.keys(table).length > 0;
		const base = {
			route,
			displayName: row.displayName,
			settingsNs: row.settingsNs,
			configured: false,
			mapped,
			resolved: catalog !== void 0,
			models: [],
			orphans: [],
			errors: [],
			counts: {
				models: 0,
				mapped: 0,
				filled: 0,
				unchanged: 0,
				unmapped: 0,
				invalid: 0
			}
		};
		const view = views.find((candidate) => candidate.ns === row.settingsNs);
		if (view === void 0) {
			if (!mapped) continue;
			reports.push({
				...base,
				reason: `settings namespace "${row.settingsNs}" is not registered`
			});
			continue;
		}
		const routePath = row.settingsPath ?? [];
		if (readAt(view.value, routePath) === void 0) {
			if (!mapped) continue;
			reports.push({
				...base,
				reason: `route "${route}" is not configured in ${row.settingsNs}`
			});
			continue;
		}
		const modelsPath = [...routePath, "models"];
		const declared = (modelsArrayOf(readAt(view.user, modelsPath)) ?? modelsArrayOf(readAt(view.value, modelsPath)) ?? []).filter((entry) => typeof entry?.id === "string" && entry.id.length > 0);
		base.configured = true;
		if (catalog === void 0) {
			const reported = declared.map((entry) => ({
				id: entry.id,
				declared: [
					"name",
					"contextWindow",
					"maxTokens",
					"input",
					"reasoningEfforts"
				].filter((field) => entry[field] !== void 0),
				source: table[entry.id],
				state: table[entry.id] === void 0 ? "unmapped" : "mapped",
				filled: {}
			}));
			reports.push({
				...base,
				models: reported,
				orphans: Object.keys(table).filter((id) => !declared.some((entry) => entry.id === id)),
				counts: countStates(reported)
			});
			continue;
		}
		const inspection = inspectRoute({
			route,
			models: declared,
			mapping: table,
			catalog,
			requireCompleteMapping: input.requireCompleteMapping
		});
		const reported = inspection.models.map(project);
		reports.push({
			...base,
			models: reported,
			orphans: inspection.orphans,
			errors: inspection.errors,
			counts: countStates(reported)
		});
	}
	for (const route of Object.keys(mapping)) {
		if (seen.has(route)) continue;
		const table = mapping[route] ?? {};
		reports.push({
			route,
			settingsNs: TARGET_NS,
			configured: false,
			mapped: Object.keys(table).length > 0,
			resolved: catalog !== void 0,
			models: [],
			orphans: [],
			errors: [],
			counts: {
				models: 0,
				mapped: 0,
				filled: 0,
				unchanged: 0,
				unmapped: 0,
				invalid: 0
			},
			reason: `route "${route}" is not a configurable provider of ${TARGET_NS}`
		});
	}
	return reports;
}
/** Describe one catalog record as a candidate. */
function candidateFrom(provider, providerName, modelId, model) {
	const capabilities = capabilitiesFromModel(model);
	const levels = effortValues(model);
	const problem = capabilities !== null ? void 0 : `not a live tool-calling chat model (tool_call=${String(model.tool_call)}, status=${String(model.status)})`;
	return {
		source: `${provider}/${modelId}`,
		provider,
		providerName,
		model: modelId,
		name: typeof model.name === "string" ? model.name : void 0,
		contextWindow: model.limit?.context !== void 0 && model.limit.context > 0 ? model.limit.context : void 0,
		maxTokens: model.limit?.output !== void 0 && model.limit.output > 0 ? model.limit.output : void 0,
		input: Array.isArray(model.modalities?.input) ? model.modalities.input : void 0,
		toolCall: model.tool_call === true,
		status: typeof model.status === "string" ? model.status : void 0,
		usable: isAgentModel(model),
		problem,
		effortLevels: levels.length > 0 ? levels : void 0
	};
}
/** Rank one candidate against a query: lower is better, `undefined` means no match. */
function score(candidate, query) {
	const source = candidate.source.toLowerCase();
	const model = candidate.model.toLowerCase();
	const name = (candidate.name ?? "").toLowerCase();
	if (source === query) return 0;
	if (model === query) return 1;
	if (model.startsWith(query)) return 2;
	if (model.includes(query)) return 3;
	if (source.includes(query)) return 4;
	if (name.includes(query)) return 5;
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
function searchCatalog(catalog, query, limit = 40) {
	const needle = query.trim().toLowerCase();
	if (catalog === void 0) return [];
	const scored = [];
	for (const [provider, entry] of Object.entries(catalog)) for (const [modelId, model] of Object.entries(entry?.models ?? {})) {
		const candidate = candidateFrom(provider, entry?.name, modelId, model);
		const rank = needle.length === 0 ? 6 : score(candidate, needle);
		if (rank === void 0) continue;
		scored.push({
			candidate,
			rank
		});
	}
	scored.sort((left, right) => {
		if (left.rank !== right.rank) return left.rank - right.rank;
		if (left.candidate.usable !== right.candidate.usable) return left.candidate.usable ? -1 : 1;
		return left.candidate.source.localeCompare(right.candidate.source);
	});
	return scored.slice(0, Math.max(0, limit)).map((row) => row.candidate);
}
//#endregion
//#region src/index.ts
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
/** Stable cordis plugin name. */
const name = "dsh-autofill-model-metadata";
/** The service this plugin composes over: the llm directory knows the routes. */
const inject = ["llm"];
/** The plugin's own state directory name under `$DSH_HOME/plugins`. */
const NS = "dsh-autofill-model-metadata";
/** The living models.dev catalog. */
const DEFAULT_URL = "https://models.dev/api.json";
/** Every settings-page endpoint, all loopback-only. */
const BASE_PATH = "/api/dsh-autofill-model-metadata";
/** `POST` apply now; `GET` what the last pass did. */
const APPLY_PATH = `${BASE_PATH}/apply`;
/** `GET` the last pass and the unresolved route report. */
const STATUS_PATH = `${BASE_PATH}/status`;
/** `GET` the route report resolved against the catalog (loads it if needed). */
const INSPECT_PATH = `${BASE_PATH}/inspect`;
/** `GET ?q=` search the catalog for mapping targets. */
const CATALOG_PATH = `${BASE_PATH}/catalog`;
/** `POST {mapping, apply?}` replace the mapping (and optionally apply it). */
const MAPPING_PATH = `${BASE_PATH}/mapping`;
/**
* Where the browser half reports that it loaded.
*
* The default `builtinSettingsForm: 'auto'` policy waits for this call before
* dropping the host-generated settings form, so stock settings survive a client
* bundle that never runs.
*/
const LIVE_PATH = `${BASE_PATH}/page-live`;
/** A body larger than this is refused rather than buffered. */
const MAX_BODY_BYTES = 65536;
/**
* Plugin configuration.
*
* Every field is volatile: the host renders this schema into the plugin's
* settings form and applies an edit without remounting the entry.
*/
const Config = z.object({
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
	builtinSettingsForm: z.string().default("auto").volatile(),
	/**
	* The explicit mapping: `mapping.<route>.<modelId> = "<models.dev provider>/<models.dev model>"`.
	* An empty mapping keeps the plugin completely inert — not even the catalog is fetched.
	*/
	mapping: z.dict(z.dict(z.string())).default({}).volatile()
});
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
function resolveOwnEntryId(ctx) {
	const loader = ctx?.loader;
	const fiber = ctx?.fiber;
	let entries;
	try {
		entries = loader?.entries?.() ?? [];
	} catch {
		return;
	}
	let fallback;
	for (const entry of entries) {
		const id = entry?.options?.id;
		if (typeof id !== "string" || id.length === 0) continue;
		if (entry.fiber !== void 0 && entry.fiber === fiber && entry.disabled !== true) return id;
		if (entry?.options?.name !== NS || entry.disabled === true) continue;
		fallback ??= id;
	}
	return fallback;
}
/** `$DSH_HOME`, falling back to `~/.dsh` the way the host does. */
function dshHome() {
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}
/** Append one best-effort line to this plugin's bootstrap trace. */
function trace(line) {
	try {
		const path = join(dshHome(), "plugins", NS, "bootstrap.log");
		mkdirSync(dirname(path), { recursive: true });
		appendFileSync(path, `${(/* @__PURE__ */ new Date()).toISOString()} [pid ${process.pid}] ${line}\n`);
	} catch {}
}
/**
* One config field's live value: a volatile field arrives as a reference the
* loader updates in place, so it is read through `get()` when present.
*/
function readField(field, fallback) {
	if (field === void 0 || field === null) return fallback;
	if (typeof field === "object" && typeof field.get === "function") {
		const value = field.get();
		return value === void 0 ? fallback : value;
	}
	return field;
}
/** Resolve the live configuration, applying the schema defaults. */
function resolveConfig(config) {
	const raw = config ?? {};
	const ttl = readField(raw.cacheTTLHours, 24);
	const mapping = readField(raw.mapping, {});
	return {
		modelsDevUrl: String(readField(raw.modelsDevUrl, DEFAULT_URL)),
		cachePath: String(readField(raw.cachePath, join(dshHome(), "plugins", NS, "models.dev.json"))),
		cacheTTLHours: typeof ttl === "number" && Number.isFinite(ttl) && ttl >= 0 ? ttl : 24,
		applyOnStart: readField(raw.applyOnStart, true) !== false,
		dryRun: readField(raw.dryRun, false) === true,
		requireCompleteMapping: readField(raw.requireCompleteMapping, true) !== false,
		builtinSettingsForm: readPolicy(readField(raw.builtinSettingsForm, "auto")),
		mapping: isMapping(mapping) ? mapping : {}
	};
}
/**
* Read the settings-form policy, accepting the two booleans as aliases.
*
* `true`/`false` were the first spelling of this field; keeping them working
* means an existing profile config is never the reason a page breaks.
*/
function readPolicy(value) {
	if (value === true) return "always";
	if (value === false) return "never";
	return value === "always" || value === "never" ? value : "auto";
}
/** Whether a value is a `route → { modelId → source }` table. */
function isMapping(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
	return Object.values(value).every((route) => route !== null && typeof route === "object" && !Array.isArray(route) && Object.values(route).every((source) => typeof source === "string"));
}
/** Answer one JSON response. */
function writeJson(res, status, value) {
	try {
		res.setHeader?.("content-type", "application/json; charset=utf-8");
		res.writeHead(status);
		res.end(JSON.stringify(value));
	} catch {}
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
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		let settled = false;
		const chunks = [];
		const fail = (error) => {
			if (settled) return;
			settled = true;
			reject(error);
		};
		const finish = () => {
			if (settled) return;
			settled = true;
			const raw = Buffer.concat(chunks).toString("utf8").trim();
			try {
				resolve(raw.length === 0 ? {} : JSON.parse(raw));
			} catch (error) {
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		};
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > MAX_BODY_BYTES) {
				fail(/* @__PURE__ */ new Error("request body too large"));
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", finish);
		req.on("error", fail);
		req.on("aborted", () => fail(/* @__PURE__ */ new Error("request aborted")));
	});
}
/** The shared fence: loopback only (a trusted LAN request is replayed as one). */
function isLoopback(req) {
	const address = req.socket?.remoteAddress ?? "";
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}
/** One line per outcome, for the log and the endpoint answer. */
function formatOutcome(outcome) {
	const filled = outcome.applied.filter((row) => row.filledFields.length > 0).map((row) => `${row.modelId}: ${row.filledFields.join(", ")}`);
	switch (outcome.status) {
		case "applied": return `${outcome.route}: applied (${filled.join(" | ")})`;
		case "dry-run": return `${outcome.route}: would apply (${filled.join(" | ")})`;
		case "unchanged": return `${outcome.route}: already complete`;
		default: {
			const reasons = outcome.errors.length > 0 ? outcome.errors.map((error) => error.message).join("; ") : outcome.reason ?? "refused";
			return `${outcome.route}: refused — ${reasons}`;
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
function apply(ctx, config) {
	const host = ctx;
	const state = { last: [] };
	trace(`apply: called (mapping routes=${Object.keys(resolveConfig(config).mapping).join(",") || "none"})`);
	/** The catalog store for the current configuration. */
	const storeFor = (cfg) => {
		const key = `${cfg.modelsDevUrl}|${cfg.cachePath}|${cfg.cacheTTLHours}`;
		if (state.store === void 0 || state.storeKey !== key) {
			state.store = new CatalogStore({
				url: cfg.modelsDevUrl,
				cachePath: cfg.cachePath,
				ttlMs: cfg.cacheTTLHours * 60 * 60 * 1e3,
				logger: host.logger
			});
			state.storeKey = key;
		}
		return state.store;
	};
	/** Read the catalog, remembering it for every later endpoint call. */
	const loadCatalog = async (force = false) => {
		const load = await storeFor(resolveConfig(config)).load({ force });
		state.catalog = load;
		return load;
	};
	/** The provider directory, tolerating a host without one. */
	const providersOf = () => host.llm?.listConfigurableProviders?.() ?? [];
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
	const ownView = () => {
		const ns = resolveOwnEntryId(ctx);
		return ns === void 0 ? void 0 : (state.settings?.describe() ?? []).find((row) => row.ns === ns);
	};
	const documentMapping = () => {
		const view = ownView();
		for (const layer of [view?.value, view?.user]) {
			const table = readAt(layer, ["mapping"]);
			if (table !== void 0) return isMapping(table) ? table : {};
		}
		return resolveConfig(config).mapping;
	};
	/**
	* The mapping plus the revision it was read at.
	*
	* The page sends that revision back when it saves, which is what turns the
	* write into a real compare-and-set: an edit made in the config document while
	* the page sat open makes the save fail closed instead of silently replacing
	* the whole table with what the page happened to be showing.
	*/
	const documentState = () => {
		const view = ownView();
		return {
			mapping: documentMapping(),
			revision: typeof view?.revision === "number" ? view.revision : void 0
		};
	};
	/** The route report against whichever catalog is already in hand. */
	const reportOf = (catalog, mapping) => {
		if (state.settings === void 0) return [];
		return reportRoutes({
			settings: state.settings,
			providers: providersOf(),
			mapping,
			catalog: catalog?.data,
			requireCompleteMapping: resolveConfig(config).requireCompleteMapping
		});
	};
	/**
	* One apply pass: catalog read, then every mapped route.
	*
	* `options.mapping` overrides the live configuration, so a page that just wrote
	* a new mapping can apply exactly what it wrote without racing the loader's
	* volatile-reference update.
	*/
	const run = async (options = {}) => {
		const settings = state.settings;
		if (settings === void 0) return [];
		const cfg = resolveConfig(config);
		const declared = options.mapping ?? cfg.mapping;
		const routes = options.routes;
		const mapping = routes === void 0 ? declared : Object.fromEntries(routes.filter((route) => declared[route] !== void 0).map((route) => [route, declared[route]]));
		if (Object.keys(mapping).length === 0) {
			trace("run: no mapping declared — staying inert");
			return [];
		}
		const load = await loadCatalog(options.force === true);
		trace(`run: catalog ${Object.keys(load.data).length} providers (stale=${load.stale})`);
		const outcomes = await applyRoutes({
			settings,
			providers: providersOf(),
			mapping,
			catalog: load.data,
			dryRun: cfg.dryRun,
			requireCompleteMapping: cfg.requireCompleteMapping
		});
		state.last = outcomes;
		for (const outcome of outcomes) {
			const line = formatOutcome(outcome);
			trace(`run: ${line}`);
			if (outcome.status === "refused") host.logger?.warn?.(`${NS}: ${line}`);
			else host.logger?.info?.(`${NS}: ${line}`);
		}
		return outcomes;
	};
	/** Report a failed pass without taking the plugin (or the host) down. */
	const report = (error) => {
		const message = error instanceof Error ? error.message : String(error);
		trace(`run: FAILED — ${message}`);
		host.logger?.error?.(`${NS}: apply failed — ${message}`);
		if (error instanceof Error && error.stack !== void 0) host.logger?.error?.(error.stack);
	};
	/** The catalog summary both `status` and `inspect` answer with. */
	const catalogBrief = (load) => load === void 0 ? void 0 : {
		providers: Object.keys(load.data).length,
		stale: load.stale,
		fromCache: load.fromCache,
		fetchedAt: load.fetchedAt
	};
	/** POST {route?}: apply now (optionally one route); no body applies every mapping. */
	const handleApply = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "POST") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		readJsonBody(req).then((body) => {
			const route = typeof body?.route === "string" && body.route.length > 0 ? [body.route] : void 0;
			return run({
				force: true,
				routes: route
			});
		}).then((outcomes) => writeJson(res, 200, {
			ok: true,
			results: outcomes,
			log: outcomes.map(formatOutcome),
			routes: reportOf(state.catalog, resolveConfig(config).mapping)
		}), (error) => writeJson(res, 400, {
			ok: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack ?? error.message : String(error)
		}));
	};
	/**
	* GET: everything a settings page paints before it touches the network.
	*
	* No catalog is fetched here: per-model states come out of whatever a previous
	* pass already loaded, and `{INSPECT_PATH}` fills in the resolution.
	*/
	const handleStatus = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "GET") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		const cfg = resolveConfig(config);
		const { mapping, revision } = documentState();
		writeJson(res, 200, {
			ok: true,
			ns: resolveOwnEntryId(ctx),
			revision,
			mapping,
			routes: Object.keys(mapping),
			dryRun: cfg.dryRun,
			requireCompleteMapping: cfg.requireCompleteMapping,
			resolved: state.catalog !== void 0,
			reports: reportOf(state.catalog, mapping),
			catalog: catalogBrief(state.catalog),
			last: state.last,
			log: state.last.map(formatOutcome)
		});
	};
	/** GET: the route report resolved against the catalog (loading it when needed). */
	const handleInspect = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "GET") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		const { mapping, revision } = documentState();
		loadCatalog(true).then((load) => writeJson(res, 200, {
			ok: true,
			ns: resolveOwnEntryId(ctx),
			revision,
			mapping,
			resolved: true,
			catalog: catalogBrief(load),
			reports: reportOf(load, mapping)
		})).catch((error) => {
			writeJson(res, 200, {
				ok: true,
				ns: resolveOwnEntryId(ctx),
				revision,
				mapping,
				resolved: false,
				catalogError: error instanceof Error ? error.message : String(error),
				catalog: catalogBrief(state.catalog),
				reports: reportOf(void 0, mapping)
			});
		});
	};
	/** GET ?q=&limit=: catalog records that could be used as a mapping target. */
	const handleCatalog = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "GET") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		const query = url.searchParams.get("q") ?? "";
		const requested = Number(url.searchParams.get("limit") ?? "40");
		const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 200) : 40;
		loadCatalog(false).then((load) => {
			const candidates = searchCatalog(load.data, query, limit);
			writeJson(res, 200, {
				ok: true,
				query,
				limit,
				count: candidates.length,
				catalog: catalogBrief(load),
				candidates
			});
		}).catch((error) => writeJson(res, 503, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		}));
	};
	/** POST {mapping, apply?}: replace the plugin's own mapping, then optionally apply it. */
	const handleMapping = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "POST") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		readJsonBody(req).then(async (body) => {
			const settings = state.settings;
			if (settings === void 0) throw new Error("the settings service is not available");
			if (!isMapping(body?.mapping)) throw new Error("mapping must be a { route: { modelId: \"provider/model\" } } table");
			const mapping = body.mapping;
			const ns = resolveOwnEntryId(ctx);
			if (ns === void 0) throw new Error("this plugin has no loader row, so its mapping cannot be persisted");
			const view = (settings.describe() ?? []).find((candidate) => candidate.ns === ns);
			if (view === void 0) throw new Error(`settings namespace "${ns}" is not registered`);
			const expected = typeof body?.revision === "number" ? body.revision : view.revision;
			if (typeof body?.revision === "number" && body.revision !== view.revision) {
				trace(`mapping: refused — the document moved from revision ${body.revision} to ${view.revision}`);
				throw new Error(`the mapping changed since this page read it (revision ${body.revision}, now ${view.revision}); reload and reapply your edit`);
			}
			if (await settings.mutate(ns, [{
				op: "set",
				path: ["mapping"],
				value: mapping
			}], expected) === false) throw new Error(`the host refused the write to "${ns}" (revision ${view.revision}); reload and try again`);
			trace(`mapping: wrote ${Object.keys(mapping).length} route(s) to ${ns}`);
			let applied;
			let applyError;
			if (body?.apply === true) try {
				applied = await run({
					force: true,
					mapping
				});
			} catch (error) {
				applyError = error instanceof Error ? error.message : String(error);
				trace(`mapping: saved, but the pass failed — ${applyError}`);
			}
			writeJson(res, 200, {
				ok: true,
				ns,
				mapping,
				applied: applied === void 0 ? void 0 : applied.map(formatOutcome),
				applyError,
				routes: reportOf(state.catalog, mapping)
			});
		}).catch((error) => writeJson(res, 400, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		}));
	};
	/**
	* Drop the host-generated settings form, once, against this plugin's fiber.
	*
	* `configure` throws when it is called twice for the same plugin instance, so
	* the decision is remembered rather than retried.
	*/
	const dropBuiltinForm = (settings) => {
		if (state.formDropped) return;
		if (typeof settings.configure !== "function") {
			trace("bootstrap: this host cannot drop the generated settings form");
			return;
		}
		state.formDropped = true;
		try {
			host.effect?.(() => settings.configure?.({ auto: false }, host.fiber), `${NS}: own settings page`);
			trace("bootstrap: generated settings form dropped — the page is live");
		} catch (error) {
			state.formDropped = false;
			host.logger?.warn?.(`${NS}: could not claim the settings page policy — ${error instanceof Error ? error.message : String(error)}`);
		}
	};
	/**
	* Claim the settings seam; it may already be up, or appear later.
	*
	* The graphical page is preferred, but only once the browser half has proven
	* it loaded: under the default `auto` policy the host-generated form is left
	* alone here and dropped later, by {@link handlePageLive}, when the page
	* reports in. A page that never loads therefore leaves stock DSH settings —
	* the original form — as the way to edit this plugin.
	*/
	const attachSettings = (settings) => {
		if (state.settings !== void 0) return;
		state.settings = settings;
		trace("bootstrap: settings seam attached");
		const { builtinSettingsForm, applyOnStart } = resolveConfig(config);
		if (builtinSettingsForm === "never") dropBuiltinForm(settings);
		else if (builtinSettingsForm === "always") trace("bootstrap: keeping the host-generated settings form (always)");
		else if (state.pageLive === true) {
			trace("bootstrap: the page is already live — dropping the generated settings form");
			dropBuiltinForm(settings);
		} else trace("bootstrap: keeping the host-generated settings form until the page reports in");
		if (applyOnStart) run().catch(report);
	};
	/**
	* POST from the browser half: it registered, so the graphical page is live.
	*
	* This is the proof the `auto` policy waits for. It is a claim that the bundle
	* loaded, not that the page rendered — the page's own endpoints stay the real
	* contract, and a host that never receives this call simply keeps stock
	* settings.
	*/
	const handlePageLive = (req, res) => {
		if (!isLoopback(req)) return writeJson(res, 403, {
			ok: false,
			error: "forbidden: loopback-only"
		});
		if (req.method !== "POST") return writeJson(res, 405, {
			ok: false,
			error: "method-not-allowed"
		});
		state.pageLive = true;
		const policy = resolveConfig(config).builtinSettingsForm;
		if (policy === "auto" && state.settings !== void 0) dropBuiltinForm(state.settings);
		writeJson(res, 200, {
			ok: true,
			ns: resolveOwnEntryId(ctx),
			policy,
			builtinFormDropped: state.formDropped === true
		});
	};
	(async () => {
		try {
			const settings = ctx.get("settings", false);
			if (settings !== void 0) attachSettings(settings);
			else {
				trace("bootstrap: settings service not up yet — attaching when it appears");
				ctx.inject(["settings"], (settingsCtx) => {
					attachSettings(settingsCtx.settings);
				});
			}
			const webServer = ctx.get("webServer", false);
			const seatEndpoints = (seat) => {
				if (seat === void 0 || typeof seat.register !== "function") return;
				for (const [path, handler] of [
					[APPLY_PATH, handleApply],
					[STATUS_PATH, handleStatus],
					[INSPECT_PATH, handleInspect],
					[CATALOG_PATH, handleCatalog],
					[MAPPING_PATH, handleMapping],
					[LIVE_PATH, handlePageLive]
				]) seat.register({
					kind: "exact",
					path,
					handler
				});
				trace(`bootstrap: endpoints on ${BASE_PATH}/{apply,status,inspect,catalog,mapping,page-live}`);
			};
			if (webServer !== void 0) seatEndpoints(webServer);
			else {
				trace("bootstrap: webserver seat not up yet — claiming it when it appears");
				ctx.inject(["webServer"], (webCtx) => {
					seatEndpoints(webCtx.webServer);
				});
			}
			host.on?.("loader/volatile-update", () => {
				trace("bootstrap: volatile update — re-applying");
				run().catch(report);
			});
			trace("bootstrap: done");
		} catch (error) {
			trace(`bootstrap: FAILED — ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
			host.logger?.error?.(`${NS}: bootstrap failed — no model metadata was filled`);
			host.logger?.error?.(error);
		}
	})();
}
//#endregion
export { Config, apply, dshHome, formatOutcome, inject, name, resolveConfig, resolveOwnEntryId };
