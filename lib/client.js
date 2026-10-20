window.__ModuleLoader__.load({
	id: "dsh-autofill-model-metadata",
	factory: (require) => {
		var exports = { exports: {} }.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/copy.ts
		/**
		* Copy for the settings page.
		*
		* **Every value must be a plain string.** The host's locale service
		* (`dsh-client-locale`, `LocaleFace.translate`) resolves an entry and then, when
		* a call passes parameters, runs `template.replace(/\{(\w+)\}/g, …)` on it. A
		* function value therefore throws `template.replace is not a function`, and the
		* slot error boundary turns the whole page into an empty box — so interpolation
		* goes through `{placeholder}`s, which is also exactly how the shipped
		* dictionaries are written.
		*
		* The same table doubles as the built-in fallback: if the host's locale service
		* is missing or does not know this namespace, {@link makeT} interpolates here
		* instead of showing raw keys, so the page is readable on any deployment.
		*
		* @module dsh-autofill-model-metadata/client/copy
		*/
		/** The locale namespace this plugin owns. */
		const COPY_NS = "autofillModelMetadata";
		/** English copy. */
		const en = {
			nav: "Model metadata",
			title: "Model metadata autofill",
			intro: "Fill the capability fields of your own routes from the models.dev record you map to each model.",
			loading: "Loading…",
			reload: "Reload",
			inspect: "Check mappings",
			applyAll: "Fill all models",
			catalog: "Catalog",
			catalogProviders: "{count} providers",
			catalogFresh: "up to date",
			catalogCached: "from cache",
			catalogStale: "expired",
			catalogFetchedAt: "updated {when}",
			catalogUnavailable: "The catalog could not be read: {reason}",
			catalogUnavailableHint: "Mappings stay editable, but catalog records cannot be checked right now.",
			noRoutes: "There are no routes to map yet. Add a custom provider and its models under Settings → Models first.",
			noModels: "This route declares no models.",
			noUnmapped: "No unmapped models — every declared model already has a models.dev mapping.",
			model: "Model",
			declared: "Declared",
			declaredCount: "{count} fields declared",
			source: "models.dev source",
			state: "State",
			preview: "What a pass would fill",
			actions: "Actions",
			stateFilled: "to fill",
			stateUnchanged: "up to date",
			stateMapped: "mapped",
			stateUnmapped: "unmapped",
			stateInvalid: "invalid mapping",
			fillRoute: "Fill this route",
			expandRoute: "Expand route",
			collapseRoute: "Collapse route",
			willFill: "Would fill",
			dirtyTag: "Unsaved",
			cancel: "Cancel",
			summaryFilled: "{count} to fill",
			summaryUnchanged: "{count} up to date",
			summaryMapped: "{count} mapped",
			summaryUnmapped: "{count} unmapped",
			summaryInvalid: "{count} invalid",
			summaryModels: "{count} models",
			nothingDeclared: "no declared fields",
			clear: "Clear mapping",
			search: "Search catalog",
			searching: "Searching…",
			searchHint: "Search by model ID or provider, then pick a models.dev record.",
			noCandidates: "No matching models.",
			unusable: "no tool calling",
			orphans: "Mappings for models this route does not declare",
			remove: "Remove mapping",
			unmappedOnly: "Only unmapped models",
			save: "Save mapping",
			saveApply: "Save and fill",
			saving: "Saving…",
			saved: "Mapping saved.",
			savedApplied: "Mapping saved and filled.",
			savedRefused: "Mapping saved, but {route} was not filled — see the reasons below.",
			savedApplyFailed: "Mapping saved, but the fill failed: {reason}",
			savedDryRun: "Mapping saved. Dry run mode does not write the configuration.",
			savedNothing: "Mapping saved. Every mapping is already up to date.",
			applied: "Fill pass complete.",
			fillDryRun: "Dry run: nothing was written.",
			fillNothing: "Nothing needed filling.",
			fillRefused: "Some routes could not be filled — see the reasons below.",
			failed: "Failed: {reason}",
			dirty: "unsaved changes",
			clean: "saved",
			coverage: "{mapped}/{models} models mapped",
			blocked: "{routes} route(s) still have unmapped models; fill them before saving and filling.",
			dryRun: "Dry run: only reports results, does not write the configuration.",
			builtinFormKept: "This configuration page is unavailable. Edit the plugin config, or reload the page.",
			neverOverwrites: "Fields you declare by hand are never overwritten automatically.",
			crashed: "This settings page failed to render: {reason}",
			crashedHint: "The plugin itself is still running. Edit the mapping in the plugin config, or reload the page."
		};
		/** Chinese copy. */
		const zh = {
			nav: "模型元数据",
			title: "模型元数据补齐",
			intro: "用你指定的 models.dev 记录，为自己路由中的每个模型补齐能力参数。",
			loading: "加载中…",
			reload: "重新加载",
			inspect: "校验映射",
			applyAll: "填充全部模型",
			catalog: "目录",
			catalogProviders: "{count} 个提供商",
			catalogFresh: "最新数据",
			catalogCached: "来自缓存",
			catalogStale: "数据已过期",
			catalogFetchedAt: "更新于 {when}",
			catalogUnavailable: "无法读取目录：{reason}",
			catalogUnavailableHint: "映射仍可编辑，但暂时无法校验目录记录。",
			noRoutes: "当前配置里还没有可映射的路由。请先在「设置 → 模型」中添加自定义提供商和模型。",
			noModels: "该路由没有声明任何模型。",
			noUnmapped: "没有未映射的模型 —— 所有已声明的模型都已有 models.dev 映射。",
			model: "模型",
			declared: "已声明",
			declaredCount: "已声明 {count} 个字段",
			source: "models.dev 来源",
			state: "状态",
			preview: "将填充的字段",
			actions: "操作",
			stateFilled: "待填充",
			stateUnchanged: "无需填充",
			stateMapped: "已映射",
			stateUnmapped: "未映射",
			stateInvalid: "映射无效",
			fillRoute: "填充此路由",
			expandRoute: "展开模型列表",
			collapseRoute: "收起模型列表",
			willFill: "将填充",
			dirtyTag: "未保存",
			cancel: "取消",
			summaryFilled: "{count} 个待填充",
			summaryUnchanged: "{count} 个无需填充",
			summaryMapped: "{count} 个已映射",
			summaryUnmapped: "{count} 个未映射",
			summaryInvalid: "{count} 个无效",
			summaryModels: "{count} 个模型",
			nothingDeclared: "未声明字段",
			clear: "清除映射",
			search: "搜索目录",
			searching: "正在搜索…",
			searchHint: "搜索模型 ID 或提供商，选择一条 models.dev 记录。",
			noCandidates: "没有匹配的模型记录。",
			unusable: "不支持工具调用",
			orphans: "这些映射指向该路由未声明的模型",
			remove: "移除映射",
			unmappedOnly: "仅显示未映射模型",
			save: "保存映射",
			saveApply: "保存并填充",
			saving: "保存中…",
			saved: "映射已保存。",
			savedApplied: "映射已保存并填充。",
			savedRefused: "映射已保存，但 {route} 未能填充，原因见下方。",
			savedApplyFailed: "映射已保存，但填充失败：{reason}",
			savedDryRun: "映射已保存。试运行模式不会写入配置。",
			savedNothing: "映射已保存。所有映射均无需填充。",
			applied: "填充完成。",
			fillDryRun: "试运行中：未写入配置。",
			fillNothing: "所有映射均无需填充。",
			fillRefused: "有路由未能填充，原因见下方。",
			failed: "失败：{reason}",
			dirty: "有未保存修改",
			clean: "已保存",
			coverage: "{mapped}/{models} 个模型已映射",
			blocked: "有 {routes} 条路由还有模型未映射，补齐后才能保存并填充。",
			dryRun: "试运行中：仅报告结果，不会写入配置。",
			builtinFormKept: "配置页暂时不可用。可先编辑插件配置，或重新加载页面。",
			neverOverwrites: "手工声明的字段不会被自动覆盖。",
			crashed: "配置页渲染失败：{reason}",
			crashedHint: "插件仍在运行。可在插件配置中编辑映射，或重新加载页面。"
		};
		/**
		* Wrap the locale-bound translator so a missing key still reads as copy.
		*
		* `ctx.locale.bind(ns)` is only present when the host's locale service knows the
		* namespace; a bound translator also echoes the key back when it has no entry.
		* Both cases fall back to the dictionary above, interpolated the same way the
		* platform does it.
		*
		* @param bound - the translator the slot kit bound, if any.
		* @returns a translator that always answers a string.
		*/
		function makeT(bound, fallback = zh) {
			return (key, params) => {
				return readBound(bound, key, params) ?? interpolate(fallback[key], params);
			};
		}
		/**
		* Pick the bundled dictionary that matches the active locale.
		*
		* The host's locale service is the real source; this is only the fallback for a
		* key it cannot answer, and defaulting it to Chinese would show Chinese copy on
		* an English deployment.
		*
		* @param active - the active locale id, as the service reports it.
		*/
		function fallbackFor(active) {
			return typeof active === "string" && active.toLowerCase().startsWith("en") ? en : zh;
		}
		/** Ask the bound translator, treating an echoed key or a non-string as absent. */
		function readBound(bound, key, params) {
			if (typeof bound !== "function") return void 0;
			try {
				const answer = bound(key, params);
				return typeof answer === "string" && answer !== key ? answer : void 0;
			} catch {
				return;
			}
		}
		/**
		* Fill `{placeholder}`s exactly the way `LocaleFace.translate` does.
		*
		* The pattern must stay identical to the platform's: a name with no matching
		* parameter is left alone rather than blanked, so a missing argument shows up as
		* visible copy instead of a silent hole.
		*
		* @param template - the copy, with `{name}` placeholders.
		* @param params - the values to substitute.
		*/
		function interpolate(template, params) {
			if (params === void 0) return template;
			return template.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
		}
		//#endregion
		//#region src/client/api.ts
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
		const API_BASE = "/api/dsh-autofill-model-metadata";
		/** A failed call, carrying the host's own message when it gave one. */
		var ApiError = class extends Error {
			status;
			constructor(status, message) {
				super(message);
				this.name = "ApiError";
				this.status = status;
			}
		};
		/** Read a JSON answer, turning a non-2xx into an {@link ApiError}. */
		async function readJson(fetcher, path, init) {
			const response = await fetcher(`${API_BASE}${path}`, init);
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new ApiError(response.status, `the host answered ${response.status} without JSON`);
			}
			if (!response.ok) {
				const message = payload?.error;
				throw new ApiError(response.status, typeof message === "string" ? message : `the host answered ${response.status}`);
			}
			return payload;
		}
		/** `GET /status`: the unresolved picture, no catalog fetch. */
		function fetchStatus(fetcher) {
			return readJson(fetcher, "/status");
		}
		/** `GET /inspect`: the picture resolved against the catalog (loads it if needed). */
		function fetchInspect(fetcher) {
			return readJson(fetcher, "/inspect");
		}
		/** `GET /catalog?q=`: candidate mapping targets. */
		function searchCatalog(fetcher, query, limit = 40) {
			return readJson(fetcher, `/catalog?${new URLSearchParams({
				q: query,
				limit: String(limit)
			}).toString()}`);
		}
		/** `POST /mapping`: persist the whole table, optionally applying it in the same call. */
		function saveMapping(fetcher, mapping, apply, revision) {
			return readJson(fetcher, "/mapping", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(revision === void 0 ? {
					mapping,
					apply
				} : {
					mapping,
					apply,
					revision
				})
			});
		}
		/** `POST /apply`: fill every mapped route from the catalog. */
		function applyNow(fetcher, route) {
			return readJson(fetcher, "/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(route === void 0 ? {} : { route })
			});
		}
		//#endregion
		//#region src/client/model.ts
		/** The identity of one table row, used as a React key and a search-state key. */
		function rowKey(route, modelId) {
			return `${route}\u0000${modelId}`;
		}
		/** The mapping value for one model, or undefined. */
		function sourceOf(mapping, route, modelId) {
			return mapping[route]?.[modelId];
		}
		/**
		* Set or clear one mapping entry, immutably.
		*
		* An empty value removes the entry (and a route that becomes empty is dropped),
		* so a cleared field is indistinguishable from a key the operator never wrote —
		* which is what the completeness rule must see.
		*
		* @param mapping - the current table.
		* @param route - the route to edit.
		* @param modelId - the local model id to edit.
		* @param source - the new `provider/model`, or an empty string to clear it.
		* @returns a new table.
		*/
		function withSource(mapping, route, modelId, source) {
			const table = { ...mapping[route] ?? {} };
			const trimmed = source.trim();
			if (trimmed.length === 0) delete table[modelId];
			else table[modelId] = trimmed;
			const next = { ...mapping };
			if (Object.keys(table).length === 0) delete next[route];
			else next[route] = table;
			return next;
		}
		/** Whether two mappings carry the same entries (order-insensitive). */
		function sameMapping(left, right) {
			const routes = /* @__PURE__ */ new Set([...Object.keys(left), ...Object.keys(right)]);
			for (const route of routes) {
				const a = left[route] ?? {};
				const b = right[route] ?? {};
				const ids = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
				for (const id of ids) if (a[id] !== b[id]) return false;
			}
			return true;
		}
		/**
		* Decide what the draft becomes after the host's table is (re)read.
		*
		* The operator's unsaved edits are work: they are adopted only when the draft
		* held nothing beyond what the host already had. The moment the draft differs
		* from the saved table — including a cleared entry, which makes it differ by
		* *absence* — the reload leaves it alone, so pressing "Check against catalog"
		* cannot silently discard an edit.
		*
		* @param draft - the table as currently edited.
		* @param saved - the table as the host last held it.
		* @param incoming - the table just read from the host.
		* @returns the draft to show.
		*/
		function adoptDraft(draft, saved, incoming) {
			return sameMapping(draft, saved) ? incoming : draft;
		}
		/** Turn one host-report into the row list the page renders. */
		function rowsOf(report) {
			return report.models.map((model) => ({
				modelId: model.id,
				route: report.route,
				source: model.source,
				savedSource: model.source,
				edited: false,
				declared: model.declared,
				filled: model.filled,
				state: model.state,
				error: model.error
			}));
		}
		/** Turn one host-report into the card the page renders. */
		function cardOf(report) {
			return {
				route: report.route,
				displayName: report.displayName ?? report.route,
				configured: report.configured,
				reason: report.reason,
				rows: rowsOf(report),
				orphans: report.orphans,
				errors: report.errors,
				counts: report.counts,
				writable: report.configured && report.errors.length === 0 && report.models.some((model) => model.state === "filled")
			};
		}
		/**
		* Build the cards from the host report plus the local draft.
		*
		* The draft mapping is what the page shows, because it is what Save would send:
		* reading the display value back out of the report would resurrect a value the
		* operator just cleared. The report still supplies everything the page cannot
		* know locally — which fields are declared, what a pass would fill, which
		* refusals apply, and whether the catalog resolved.
		*
		* @param reports - the host's route reports.
		* @param draft - the mapping as currently edited.
		* @param saved - the mapping the host holds.
		*/
		function cardsFor(reports, draft, saved) {
			return reports.map((report) => {
				const card = cardOf(report);
				const rows = report.models.map((model) => {
					const source = sourceOf(draft, report.route, model.id);
					const savedSource = sourceOf(saved, report.route, model.id);
					return {
						modelId: model.id,
						route: report.route,
						source,
						savedSource,
						edited: source !== savedSource,
						declared: model.declared,
						filled: model.filled,
						state: model.state,
						error: model.error
					};
				});
				const edited = new Set(rows.filter((row) => row.edited).map((row) => row.modelId));
				const drafted = new Set(Object.keys(draft[report.route] ?? {}));
				const orphans = [...drafted].filter((key) => !rows.some((row) => row.modelId === key));
				const errors = card.errors.filter((error) => error.modelId === void 0 || drafted.has(error.modelId) && !edited.has(error.modelId));
				const gaps = rows.some((row) => row.source === void 0);
				return {
					...card,
					rows,
					orphans,
					errors,
					writable: card.configured && !gaps && orphans.length === 0 && errors.length === 0 && rows.length > 0
				};
			});
		}
		/**
		* The one-line summary of a route card.
		*
		* Counts are returned as keys rather than a finished sentence so the caller can
		* translate them: this module holds no copy, because copy that never reaches the
		* locale service cannot be translated or overridden.
		*
		* @param counts - the route's state counts.
		* @returns the parts to render, each with its count.
		*/
		function summaryParts(counts) {
			const parts = [];
			if (counts.filled > 0) parts.push({
				key: "summaryFilled",
				count: counts.filled
			});
			if (counts.unchanged > 0) parts.push({
				key: "summaryUnchanged",
				count: counts.unchanged
			});
			if (counts.mapped > 0) parts.push({
				key: "summaryMapped",
				count: counts.mapped
			});
			if (counts.unmapped > 0) parts.push({
				key: "summaryUnmapped",
				count: counts.unmapped
			});
			if (counts.invalid > 0) parts.push({
				key: "summaryInvalid",
				count: counts.invalid
			});
			if (parts.length === 0) parts.push({
				key: "summaryModels",
				count: counts.models
			});
			return parts;
		}
		/** The tag tone of a route summary, matching what the state means. */
		function summaryTone(key) {
			switch (key) {
				case "summaryFilled":
				case "summaryMapped": return "info";
				case "summaryUnchanged": return "ok";
				case "summaryUnmapped": return "warn";
				case "summaryInvalid": return "bad";
				default: return "neutral";
			}
		}
		/**
		* Count the draft's coverage, which is what the footer summarises.
		*
		* `blockedRoutes` mirrors the *host's* refusal rules, including
		* `requireCompleteMapping`: with completeness turned off an unmapped model is
		* not a reason to refuse, so it must not be a reason to disable the button
		* either — otherwise the page withholds an action the host would accept.
		*
		* @param cards - the route cards, built from the draft.
		* @param requireCompleteMapping - the configured rule; defaults to the strict one.
		*/
		function coverageOf(cards, requireCompleteMapping = true) {
			const coverage = {
				models: 0,
				mapped: 0,
				unmapped: 0,
				edited: 0,
				blockedRoutes: 0
			};
			for (const card of cards) {
				let unmapped = 0;
				for (const row of card.rows) {
					coverage.models += 1;
					if (row.source === void 0) unmapped += 1;
					else coverage.mapped += 1;
					if (row.edited) coverage.edited += 1;
				}
				coverage.unmapped += unmapped;
				const gap = requireCompleteMapping && unmapped > 0;
				if (card.configured && (gap || card.orphans.length > 0 || card.errors.length > 0)) coverage.blockedRoutes += 1;
			}
			return coverage;
		}
		/** Read one host `formatOutcome` line back into its kind. */
		function outcomeOf(line) {
			if (line.includes(": refused")) return "refused";
			if (line.includes(": would apply")) return "dry-run";
			if (line.includes(": already complete")) return "unchanged";
			return "applied";
		}
		/**
		* Summarise a pass the way a person would describe it.
		*
		* The page must not claim a fill that did not happen: a dry run writes nothing
		* and an already-complete route has nothing to write, so both are reported as
		* what they are rather than as "applied".
		*
		* @param lines - the host's outcome lines.
		*/
		function summarizePass(lines) {
			if (lines.length === 0) return { kind: "empty" };
			const outcomes = lines.map((line) => ({
				kind: outcomeOf(line),
				route: line.split(":")[0] ?? ""
			}));
			const refused = outcomes.find((entry) => entry.kind === "refused");
			if (refused !== void 0) return {
				kind: "refused",
				route: refused.route
			};
			if (outcomes.every((entry) => entry.kind === "dry-run")) return { kind: "dry-run" };
			if (outcomes.every((entry) => entry.kind === "unchanged")) return { kind: "unchanged" };
			return { kind: "applied" };
		}
		/** Format a token budget the way the page shows it. */
		function formatTokens(value) {
			if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
			if (value >= 1e6) return `${Math.round(value / 1048576 * 10) / 10}M`;
			if (value >= 1e3) return `${Math.round(value / 1e3)}K`;
			return String(value);
		}
		/**
		* The candidate's facts without its mapping source.
		*
		* The picker shows the source on its own line and this underneath it, so the
		* two are formatted separately instead of splitting a finished string.
		*
		* @param candidate - one catalog record offered as a mapping target.
		*/
		function candidateDetail(candidate) {
			const bits = [];
			if (candidate.name !== void 0 && candidate.name !== candidate.model) bits.push(candidate.name);
			const context = formatTokens(candidate.contextWindow);
			const output = formatTokens(candidate.maxTokens);
			if (context !== void 0) bits.push(`ctx ${context}`);
			if (output !== void 0) bits.push(`out ${output}`);
			if (candidate.effortLevels !== void 0) bits.push(candidate.effortLevels.join("/"));
			if (!candidate.usable && candidate.problem !== void 0) bits.push(`✗ ${candidate.problem}`);
			return bits.join(" · ");
		}
		/**
		* The fields a pass would fill, as label/value pairs.
		*
		* The page renders these as chips, so the value is already the compact form:
		* token budgets become `1M`/`66K` like the candidate picker shows them, arrays
		* join with `+`, and nested reasoning maps render as `low→high`. Keeping the
		* split out of the copy lets the view style the label and value differently
		* without re-parsing a finished string.
		*
		* @param filled - the host's per-model field preview.
		*/
		function describeFilledFields(filled) {
			return Object.entries(filled).map(([field, value]) => ({
				field,
				value: filledValue(field, value)
			}));
		}
		/** Render one filled value compactly, formatting token budgets as tokens. */
		function filledValue(field, value) {
			if (typeof value === "number" && (field === "contextWindow" || field === "maxTokens")) return formatTokens(value) ?? String(value);
			return summarizeValue(value);
		}
		/** Render one filled value compactly. */
		function summarizeValue(value) {
			if (Array.isArray(value)) return value.join("+");
			if (value === null || typeof value !== "object") return String(value);
			return Object.entries(value).map(([key, inner]) => `${key}→${inner === null ? "inherit" : String(inner)}`).join(" ");
		}
		/** A timestamp as a short local string, or undefined. */
		function formatFetchedAt(fetchedAt) {
			if (typeof fetchedAt !== "number" || !Number.isFinite(fetchedAt)) return void 0;
			try {
				return new Date(fetchedAt).toLocaleString();
			} catch {
				return;
			}
		}
		/** The copy key a state badge shows. */
		function stateKey(state) {
			switch (state) {
				case "filled": return "stateFilled";
				case "unchanged": return "stateUnchanged";
				case "invalid": return "stateInvalid";
				case "mapped": return "stateMapped";
				default: return "stateUnmapped";
			}
		}
		/** The tone of a state badge, so the page colours it consistently. */
		function stateTone(state) {
			switch (state) {
				case "unchanged": return "ok";
				case "filled": return "info";
				case "invalid": return "bad";
				case "mapped": return "info";
				default: return "warn";
			}
		}
		//#endregion
		//#region src/client/view.tsx
		/** Page styles: host tokens only, no literal colours. */
		const PAGE_CSS = `
.dsh-af-page{display:flex;flex-direction:column;gap:16px;max-width:720px;min-width:0;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;box-sizing:border-box}
.dsh-af-head{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-af-title{margin:0;font-size:16px;font-weight:500;line-height:24px}
.dsh-af-intro{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh-af-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
.dsh-af-toolbarActions{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px}
.dsh-af-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm);border:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}
.dsh-af-btn:disabled{opacity:.4;cursor:not-allowed}
.dsh-af-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dsh-af-btn[data-variant=secondary]{border:.5px solid var(--dsw-alias-border-l3);background:transparent}
.dsh-af-btn[data-variant=primary]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);font-size:14px;line-height:22px}
.dsh-af-btn[data-variant=ghost]{padding:0 8px;color:var(--dsw-alias-label-secondary)}
.dsh-af-btn[data-variant=icon]{flex:none;width:24px;height:24px;padding:0;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-tertiary)}
.dsh-af-btn[data-size=md]{height:36px;padding:0 14px;border-radius:var(--dsw-radius-md);font-size:14px;line-height:22px}
.dsh-af-btn[data-variant=ghost]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-af-btn[data-variant=icon]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-af-btn[data-variant=secondary]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-af-btn[data-variant=primary]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dsh-af-btn[data-loading=true] .dsh-af-icon{animation:dsh-af-spin .8s linear infinite}
@keyframes dsh-af-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.dsh-af-btn[data-loading=true] .dsh-af-icon{animation:none}}
.dsh-af-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center}
.dsh-af-check{display:inline-flex;align-items:center;gap:6px;margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}
.dsh-af-check input{flex:0 0 auto;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:inherit}
.dsh-af-check input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dsh-af-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary)}
.dsh-af-dot[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}
.dsh-af-dot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}
.dsh-af-dot[data-tone=bad]{background:var(--dsw-alias-state-error-primary)}
.dsh-af-statusText{min-width:0;overflow-wrap:anywhere}
.dsh-af-statusCoverage{margin-left:auto;flex:none}
.dsh-af-tag{display:inline-flex;align-items:center;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;font-weight:500;white-space:nowrap}
.dsh-af-tag[data-tone=ok]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent);color:var(--dsw-alias-state-success-primary)}
.dsh-af-tag[data-tone=info]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);color:var(--dsw-alias-state-business-primary)}
.dsh-af-tag[data-tone=warn]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);color:var(--dsw-alias-state-warn-primary)}
.dsh-af-tag[data-tone=bad]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-af-tag[data-tone=neutral]{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}
.dsh-af-tagIcon{display:inline-flex;flex:none;align-items:center;justify-content:center;margin-right:4px}
.dsh-af-tagIcon svg{width:12px;height:12px}
.dsh-af-banner{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-af-banner[data-tone=bad]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-af-banner[data-tone=warn]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent);color:var(--dsw-alias-state-warn-label)}
.dsh-af-bannerTitle{font-weight:500}
.dsh-af-bannerHint{opacity:.8}
.dsh-af-groups{display:flex;flex-direction:column;gap:16px;min-width:0}
.dsh-af-group{display:flex;flex-direction:column;min-width:0}
.dsh-af-routeCard{min-width:0;overflow:hidden;border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill)}
.dsh-af-cardHead{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;padding:12px 14px}
.dsh-af-headIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-cardToggle{display:flex;flex:1 1 auto;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;margin:-2px -4px;padding:2px 4px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsh-af-cardToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-af-cardToggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dsh-af-chevron{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);transition:transform .12s ease}
.dsh-af-chevron[data-expanded=false]{transform:rotate(-90deg)}
@media (prefers-reduced-motion:reduce){.dsh-af-chevron{transition:none}}
.dsh-af-groupTitle{margin:0;font-size:14px;font-weight:500;line-height:22px;overflow-wrap:anywhere}
.dsh-af-groupRoute{flex:none;padding:1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11px;line-height:16px}
.dsh-af-groupCounts{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0}
.dsh-af-groupActions{margin-left:auto;display:inline-flex;align-items:center;gap:6px}
.dsh-af-reason{margin:0;padding:0 14px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-modelList{border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-model{display:flex;flex-direction:column;gap:8px;min-width:0;padding:12px 14px}
.dsh-af-model + .dsh-af-model{border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-modelLine{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-af-modelIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-modelId{flex:1 1 0;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12.5px;font-weight:500;line-height:20px}
.dsh-af-mapArrow{display:inline-flex;flex:none;color:var(--dsw-alias-label-caption)}
.dsh-af-mapField{box-sizing:border-box;display:flex;align-items:center;gap:2px;flex:1 1 0;min-width:0;height:32px;padding:0 2px 0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.dsh-af-mapField:focus-within{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}
.dsh-af-mapInput{flex:1 1 auto;min-width:0;padding:0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:13px;line-height:20px}
.dsh-af-mapInput::placeholder{color:var(--dsw-alias-label-dimmed);font-family:var(--ds-font-family-text,inherit)}
.dsh-af-stateSlot{display:inline-flex;flex:none;align-items:center;gap:4px}
.dsh-af-facts{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-fact{display:inline-flex;align-items:center;gap:4px;min-width:0}
.dsh-af-factIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-caption)}
.dsh-af-factIcon[data-tone=info]{color:var(--dsw-alias-state-business-primary)}
.dsh-af-factLabel{white-space:nowrap}
.dsh-af-factValue{min-width:0;overflow-wrap:anywhere}
.dsh-af-chips{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0}
.dsh-af-chip{display:inline-flex;align-items:baseline;gap:4px;max-width:100%;padding:1px 6px;border-radius:var(--dsw-radius-xs);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);font-size:11px;line-height:16px}
.dsh-af-chipKey{color:var(--dsw-alias-state-business-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);opacity:.8}
.dsh-af-chipValue{color:var(--dsw-alias-state-business-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);overflow-wrap:anywhere}
.dsh-af-rowError{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-search{display:flex;flex-direction:column;gap:6px;min-width:0;padding-top:8px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-searchHead{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-af-searchField{box-sizing:border-box;display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.dsh-af-searchField:focus-within{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}
.dsh-af-searchIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-searchInput{flex:1 1 auto;min-width:0;padding:0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}
.dsh-af-searchInput::placeholder{color:var(--dsw-alias-label-dimmed)}
.dsh-af-candidates{display:flex;flex-direction:column;gap:1px;min-width:0;max-height:240px;overflow-y:auto;border-radius:var(--dsw-radius-md)}
.dsh-af-candidate{display:flex;flex-direction:column;gap:1px;width:100%;min-width:0;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsh-af-candidate:hover,.dsh-af-candidate:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-af-candidate:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-af-candidate[data-usable=false]{opacity:.7}
.dsh-af-candidateSource{min-width:0;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-candidateMeta{min-width:0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dsh-af-searchNotice{padding:6px 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-extras{display:flex;flex-direction:column;gap:4px;min-width:0;padding:9px 14px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-extrasLine{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-orphan{display:inline-flex;align-items:center;gap:2px;padding:1px 2px 1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs)}
.dsh-af-orphanKey{color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dsh-af-empty{margin:0;padding:24px 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;text-align:center}
.dsh-af-emptyState{display:flex;flex-direction:column;align-items:center;gap:6px;padding:26px 16px;border:.5px dashed var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xl);color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;text-align:center}
.dsh-af-emptyStateIcon{display:inline-flex;color:var(--dsw-alias-label-caption)}
.dsh-af-emptyInline{margin:0;padding:0 14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-footer{display:flex;flex-wrap:wrap;align-items:center;gap:12px;min-width:0;margin-top:4px;padding-top:12px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-footerInfo{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;flex:1 1 240px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-dirtyDot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
.dsh-af-dirtyDot[data-dirty=true]{background:var(--dsw-alias-state-warn-primary)}
.dsh-af-footerMessage{color:var(--dsw-alias-label-secondary)}
.dsh-af-footerHint{color:var(--dsw-alias-label-caption)}
.dsh-af-footerActions{display:inline-flex;align-items:center;gap:8px;margin-left:auto}
`;
		/** A small pill, optionally led by an icon. */
		function Tag(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "dsh-af-tag",
				"data-tone": props.tone,
				title: props.title,
				children: [props.icon === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-af-tagIcon",
					children: props.icon
				}), props.label]
			});
		}
		/** One inline SVG at the host's stroke weight. */
		function Svg({ children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dsh-af-icon",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					width: "14",
					height: "14",
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.4",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					children
				})
			});
		}
		/** A magnifier. */
		function IconSearch() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
				cx: "7",
				cy: "7",
				r: "4.25"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.3 10.3 14 14" })] });
		}
		/** A cross, for clearing a mapping. */
		function IconClear() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Svg, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.5 4.5l7 7M11.5 4.5l-7 7" }) });
		}
		/** A mapping arrow: local model id → models.dev record. */
		function IconArrow() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.2 8h9.2" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.4 4.9 12.5 8l-3.1 3.1" })] });
		}
		/** A model box. */
		function IconModel() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.4 13 5.1v5.8L8 13.6 3 10.9V5.1l5-2.7Z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 5.1 8 7.8l5-2.7M8 7.8v5.8" })] });
		}
		/** Server rows, for a route. */
		function IconServer() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "3.2",
					y: "3.2",
					width: "9.6",
					height: "4",
					rx: "1"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "3.2",
					y: "8.8",
					width: "9.6",
					height: "4",
					rx: "1"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 5.2h.01M5.5 10.8h.01" })
			] });
		}
		/** A lightning bolt, for a fill action. */
		function IconBolt() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Svg, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 2.2 4.6 8.6h2.8L6.9 13.8l4.5-6.6H8.6L9 2.2Z" }) });
		}
		/** A list with a check, for the catalog inspection action. */
		function IconChecklist() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.8 4.4h5.6M2.8 8h5.6M2.8 11.6h3.4" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.6 10.7 12 12.1l2-2.6" })] });
		}
		/** A circular arrow, for reloading. */
		function IconRefresh() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.6-3.7" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 2.9v3.4H9.6" })] });
		}
		/** A padlock, for hand-declared (protected) fields. */
		function IconLock() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Svg, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
				x: "4.3",
				y: "7",
				width: "7.4",
				height: "6",
				rx: "1.2"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6 7V5.4a2 2 0 0 1 4 0V7" })] });
		}
		/** A sparkle, for fields a pass would fill. */
		function IconSparkle() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Svg, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.4l1.3 3.5 3.5 1.3-3.5 1.3L8 12 6.7 8.5 3.2 7.2l3.5-1.3L8 2.4Z" }) });
		}
		/** A disclosure chevron, pointing down when expanded. */
		function IconChevron() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Svg, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.8 6.2 8 9.4l3.2-3.2" }) });
		}
		/** A check, for saving. */
		function IconCheck() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Svg, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.4 8.4 6.2 11.2 12.6 4.8" }) });
		}
		/** A native button styled like the host's small and medium buttons. */
		function Button(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "dsh-af-btn",
				"data-variant": props.variant ?? "secondary",
				"data-size": props.size ?? "sm",
				"data-loading": props.loading,
				"aria-label": props.label,
				title: props.label,
				disabled: props.disabled,
				onClick: props.onClick,
				children: props.children
			});
		}
		/** One model: identity and mapping on one line, facts underneath. */
		function ModelRow(props) {
			const { row, t, search } = props;
			const filled = describeFilledFields(row.filled);
			const declared = row.declared.length;
			const rowTag = row.state !== "unchanged" || row.edited;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-af-model",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-modelLine",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-modelIcon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconModel, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-modelId",
								title: row.modelId,
								children: row.modelId
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-mapArrow",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArrow, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-af-mapField",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "dsh-af-mapInput",
										value: row.source ?? "",
										placeholder: "provider/model",
										"aria-label": `${row.modelId} ${t("source")}`,
										spellCheck: false,
										onChange: (event) => props.onEdit(row.route, row.modelId, event.target.value),
										onKeyDown: (event) => {
											if (event.key === "Enter") props.onSearch(row.route, row.modelId, row.source ?? row.modelId);
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "icon",
										label: search?.loading === true ? t("searching") : t("search"),
										loading: search?.loading === true,
										onClick: () => props.onSearch(row.route, row.modelId, row.source ?? row.modelId),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearch, {})
									}),
									row.source === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "icon",
										label: t("clear"),
										onClick: () => props.onClear(row.route, row.modelId),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClear, {})
									})
								]
							}),
							rowTag ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsh-af-stateSlot",
								children: [row.state === "unchanged" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
									label: t(stateKey(row.state), { count: 1 }),
									tone: stateTone(row.state)
								}), row.edited ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
									label: t("dirtyTag"),
									tone: "warn"
								}) : null]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-facts",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-af-fact",
							title: declared === 0 ? t("nothingDeclared") : `${t("declared")}: ${row.declared.join(" · ")}`,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-factIcon",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconLock, {})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-factValue",
								children: declared === 0 ? t("nothingDeclared") : t("declaredCount", { count: declared })
							})]
						}), filled.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-af-fact",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-factIcon",
									"data-tone": "info",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSparkle, {})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-factLabel",
									children: t("willFill")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-chips",
									children: filled.map(({ field, value }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dsh-af-chip",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-af-chipKey",
											children: field
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-af-chipValue",
											children: value
										})]
									}, field))
								})
							]
						})]
					}),
					row.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-rowError",
						children: [
							row.error.kind,
							": ",
							row.error.message
						]
					}),
					search?.open !== true ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-search",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-af-searchHead",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-af-searchField",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-searchIcon",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearch, {})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dsh-af-searchInput",
									value: search.query,
									placeholder: t("searchHint"),
									"aria-label": `${row.modelId} ${t("search")}`,
									spellCheck: false,
									autoFocus: true,
									onChange: (event) => props.onSearch(row.route, row.modelId, event.target.value)
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: () => props.onCloseSearch(row.route, row.modelId),
								children: t("cancel")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-af-candidates",
							children: [
								search.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-af-searchNotice",
									children: search.error
								}),
								search.loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-af-searchNotice",
									children: t("searching")
								}) : null,
								!search.loading && search.error === void 0 && search.candidates.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-af-searchNotice",
									children: t("noCandidates")
								}) : null,
								search.candidates.map((candidate) => {
									const detail = candidateDetail(candidate);
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsh-af-candidate",
										"data-usable": candidate.usable,
										title: candidate.usable ? candidate.source : `${candidate.source} — ${candidate.problem ?? t("unusable")}`,
										onClick: () => props.onPick(row.route, row.modelId, candidate.source),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-af-candidateSource",
											children: candidate.source
										}), detail.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsh-af-candidateMeta",
											children: detail
										})]
									}, candidate.source);
								})
							]
						})]
					})
				]
			});
		}
		/** One route: its card header, its model rows, and its refusals. */
		function RouteSection(props) {
			const { card, t } = props;
			const rows = props.unmappedOnly ? card.rows.filter((row) => row.source === void 0) : card.rows;
			if (props.unmappedOnly && rows.length === 0) return null;
			const allComplete = card.counts.models > 0 && card.counts.unchanged === card.counts.models;
			const open = props.unmappedOnly || !props.collapsed;
			const listId = `dsh-af-models-${encodeURIComponent(card.route)}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: "dsh-af-group",
				"aria-label": card.displayName,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-af-routeCard",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: "dsh-af-cardHead",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "dsh-af-cardToggle",
								"aria-expanded": open,
								"aria-controls": listId,
								title: open ? t("collapseRoute") : t("expandRoute"),
								onClick: () => props.actions.onToggleRoute(card.route),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-chevron",
										"data-expanded": open,
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconChevron, {})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-headIcon",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconServer, {})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-groupTitle",
										children: card.displayName
									}),
									card.displayName === card.route ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-groupRoute",
										children: card.route
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-groupCounts",
										children: allComplete ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
											label: t("summaryModels", { count: card.counts.models }),
											tone: "ok",
											icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCheck, {}),
											title: t("summaryUnchanged", { count: card.counts.unchanged })
										}) : summaryParts(card.counts).map((part) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
											label: t(part.key, { count: part.count }),
											tone: summaryTone(part.key)
										}, part.key))
									})
								]
							}), card.writable && !props.dirty && card.rows.some((row) => row.state === "filled") ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-groupActions",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									disabled: props.saving,
									onClick: () => props.actions.onApplyRoute(card.route),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBolt, {}), t("fillRoute")]
								})
							}) : null]
						}),
						card.reason === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dsh-af-reason",
							children: card.reason
						}),
						rows.length === 0 ? open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dsh-af-emptyInline",
							children: t("noModels")
						}) : null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							id: listId,
							className: "dsh-af-modelList",
							hidden: !open,
							children: open ? rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelRow, {
								row,
								t,
								search: props.searches[rowKey(row.route, row.modelId)],
								onEdit: props.actions.onEdit,
								onSearch: props.actions.onSearch,
								onCloseSearch: props.actions.onCloseSearch,
								onPick: props.actions.onPick,
								onClear: props.actions.onClear
							}, rowKey(row.route, row.modelId))) : null
						}),
						card.orphans.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-af-extras",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-af-extrasLine",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("orphans") }), card.orphans.map((orphan) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsh-af-orphan",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-af-orphanKey",
										children: orphan
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => props.actions.onRemoveOrphan(card.route, orphan),
										children: t("remove")
									})]
								}, orphan))]
							})
						}),
						card.errors.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-af-extras",
							children: card.errors.map((error, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-af-rowError",
								children: [
									error.kind,
									": ",
									error.message
								]
							}, `${error.kind}-${index}`))
						})
					]
				})
			});
		}
		/** The whole page. */
		function MetadataView(props) {
			const { t, info, coverage } = props;
			const catalogBits = [];
			if (info.catalogProviderCount !== void 0) {
				catalogBits.push(t("catalogProviders", { count: info.catalogProviderCount }));
				catalogBits.push(info.stale ? t("catalogStale") : info.fromCache ? t("catalogCached") : t("catalogFresh"));
			}
			const catalogText = catalogBits.length === 0 ? t("catalog") : `${t("catalog")} · ${catalogBits.join(" · ")}`;
			const catalogTone = info.catalogError !== void 0 ? "bad" : info.stale ? "warn" : info.resolved ? "ok" : "idle";
			const coverageText = t("coverage", {
				mapped: coverage.mapped,
				models: coverage.models
			});
			const coverageTone = !info.resolved ? "neutral" : coverage.unmapped > 0 || coverage.blockedRoutes > 0 ? "warn" : "ok";
			const visibleCards = props.unmappedOnly ? props.cards.filter((card) => card.rows.some((row) => row.source === void 0)) : props.cards;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-af-page",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: PAGE_CSS }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dsh-af-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: "dsh-af-title",
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dsh-af-intro",
							children: t("intro")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-toolbar",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-af-toolbarActions",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: props.onReload,
									disabled: props.loading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconRefresh, {}), t("reload")]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: props.onInspect,
									disabled: props.loading || props.saving,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconChecklist, {}), t("inspect")]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: props.onApplyAll,
									disabled: props.loading || props.saving || props.dirty,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBolt, {}), t("applyAll")]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "dsh-af-check",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: props.unmappedOnly,
								onChange: props.onToggleUnmappedOnly
							}), t("unmappedOnly")]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-status",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-dot",
								"data-tone": catalogTone,
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsh-af-statusText",
								children: [catalogText, info.fetchedAt === void 0 ? null : ` · ${t("catalogFetchedAt", { when: info.fetchedAt })}`]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-af-statusCoverage",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tag, {
									label: coverageText,
									tone: coverageTone
								})
							})
						]
					}),
					props.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-banner",
						"data-tone": "bad",
						role: "alert",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-af-bannerTitle",
							children: t("failed", { reason: props.error })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-af-bannerHint",
							children: t("builtinFormKept")
						})]
					}),
					info.resolved ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-banner",
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: info.catalogError === void 0 ? t("loading") : t("catalogUnavailable", { reason: info.catalogError }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-af-bannerHint",
							children: t("catalogUnavailableHint")
						})]
					}),
					info.dryRun ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-af-banner",
						"data-tone": "warn",
						role: "status",
						children: t("dryRun")
					}) : null,
					coverage.blockedRoutes > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-af-banner",
						"data-tone": "warn",
						role: "status",
						children: t("blocked", { routes: coverage.blockedRoutes })
					}) : null,
					props.loading && props.cards.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-af-empty",
						children: t("loading")
					}) : null,
					!props.loading && props.cards.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-af-empty",
						children: t("noRoutes")
					}) : null,
					!props.loading && props.cards.length > 0 && visibleCards.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-af-emptyState",
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-af-emptyStateIcon",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCheck, {})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("noUnmapped") })]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-af-groups",
						children: visibleCards.map((card) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RouteSection, {
							card,
							t,
							searches: props.searches,
							unmappedOnly: props.unmappedOnly,
							collapsed: props.collapsedRoutes[card.route] === true,
							saving: props.saving,
							dirty: props.dirty,
							actions: props
						}, card.route))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: "dsh-af-footer",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-af-footerInfo",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-dirtyDot",
									"data-dirty": props.dirty,
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.dirty ? t("dirty") : t("clean") }),
								props.message === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-footerMessage",
									role: "status",
									children: props.message
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-af-footerHint",
									children: t("neverOverwrites")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-af-footerActions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
								size: "md",
								variant: "secondary",
								onClick: () => props.onSave(false),
								disabled: props.saving || !props.dirty,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCheck, {}), props.saving ? t("saving") : t("save")]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Button, {
								size: "md",
								variant: "primary",
								onClick: () => props.onSave(true),
								disabled: props.saving || coverage.blockedRoutes > 0,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBolt, {}), t("saveApply")]
							})]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/page.tsx
		/**
		* The settings page, stateful half.
		*
		* Owns the draft mapping, the catalogs and the in-flight flags, and turns every
		* user gesture into one of the host endpoints. All decisions about *what* to
		* show live in {@link ./model.ts}, so this file is wiring only.
		*
		* The draft is kept separate from the host's mapping so that "unsaved changes"
		* is a real, visible state: nothing is written until Save, and a save sends the
		* whole table in one revision-fenced write.
		*
		* @module dsh-autofill-model-metadata/client/page
		*/
		/** Debounce window for the per-row catalog search. */
		const SEARCH_DEBOUNCE_MS = 200;
		/** How many catalog candidates one search asks for. */
		const SEARCH_LIMIT = 30;
		/** How long a successful save/fill notice stays on screen. */
		const MESSAGE_TTL_MS = 5e3;
		/** Where the bundle's `fetch` calls go when no override is given. */
		const globalFetch = (input, init) => fetch(input, init);
		/** The page component. */
		function MetadataPage(props = {}) {
			const t = props.t;
			const translate = (0, react.useMemo)(() => makeTranslator(t), [t]);
			const [status, setStatus] = (0, react.useState)(void 0);
			const [reports, setReports] = (0, react.useState)([]);
			const [resolved, setResolved] = (0, react.useState)(false);
			const [catalogError, setCatalogError] = (0, react.useState)(void 0);
			const [draft, setDraft] = (0, react.useState)({});
			const [saved, setSaved] = (0, react.useState)({});
			const [loading, setLoading] = (0, react.useState)(true);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(void 0);
			const [message, setMessage] = (0, react.useState)(void 0);
			const [unmappedOnly, setUnmappedOnly] = (0, react.useState)(false);
			/** Route cards the operator folded shut; absent means expanded. */
			const [collapsedRoutes, setCollapsedRoutes] = (0, react.useState)({});
			const [searches, setSearches] = (0, react.useState)({});
			/**
			* The settings revision the displayed mapping was read at.
			*
			* Sent back with a save so the host can refuse a write made against a document
			* that has since moved — otherwise an edit made in the config document while
			* this page sat open would be silently replaced by what the page shows.
			*/
			const [revision, setRevision] = (0, react.useState)(void 0);
			/** Monotonic guard so a slow answer never overwrites a newer one. */
			const generation = (0, react.useRef)(0);
			/** The host's table as of the last answer, readable inside `load`. */
			const savedRef = (0, react.useRef)({});
			const timers = (0, react.useRef)({});
			/** A pending "clear the transient status message" timer. */
			const messageTimer = (0, react.useRef)(void 0);
			/**
			* Show a status message. A success notice clears itself after a few seconds;
			* a failure notice stays until the next action because it carries a reason
			* the reader may still need.
			*
			* @param text - the message, or undefined to clear it.
			* @param transient - whether to dismiss a success notice automatically.
			*/
			const showMessage = (0, react.useCallback)((text, transient = false) => {
				const pending = messageTimer.current;
				if (pending !== void 0) clearTimeout(pending);
				messageTimer.current = void 0;
				setMessage(text);
				if (text !== void 0 && transient) messageTimer.current = setTimeout(() => {
					messageTimer.current = void 0;
					setMessage(void 0);
				}, MESSAGE_TTL_MS);
			}, []);
			/** Load the whole picture: the unresolved status, then the resolved report. */
			const load = (0, react.useCallback)(async () => {
				const mine = ++generation.current;
				setLoading(true);
				setError(void 0);
				let fromStatus;
				try {
					const base = await fetchStatus(globalFetch);
					if (mine !== generation.current) return;
					setStatus(base);
					fromStatus = base.mapping;
					setDraft((current) => adoptDraft(current, savedRef.current, base.mapping));
					setSaved(base.mapping);
					setRevision(base.revision);
					setReports(base.reports);
					setResolved(base.resolved);
					setCatalogError(void 0);
				} catch (failure) {
					if (mine !== generation.current) return;
					setError(explain(failure));
					setLoading(false);
					return;
				}
				try {
					const inspected = await fetchInspect(globalFetch);
					if (mine !== generation.current) return;
					setReports(inspected.reports);
					setResolved(inspected.resolved);
					setCatalogError(inspected.catalogError);
					setSaved(inspected.mapping);
					setRevision(inspected.revision);
					setDraft((current) => adoptDraft(current, fromStatus ?? savedRef.current, inspected.mapping));
				} catch (failure) {
					if (mine !== generation.current) return;
					setResolved(false);
					setCatalogError(explain(failure));
				} finally {
					if (mine === generation.current) setLoading(false);
				}
			}, []);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			(0, react.useEffect)(() => {
				savedRef.current = saved;
			}, [saved]);
			(0, react.useEffect)(() => () => {
				for (const timer of Object.values(timers.current)) clearTimeout(timer);
				timers.current = {};
				if (messageTimer.current !== void 0) clearTimeout(messageTimer.current);
			}, []);
			/** Edit one mapping entry locally. */
			const edit = (0, react.useCallback)((route, modelId, value) => {
				setDraft((current) => withSource(current, route, modelId, value));
			}, []);
			/** Open the picker for one row and search with what the field already holds. */
			const search = (0, react.useCallback)((route, modelId, query) => {
				const key = `${route}\u0000${modelId}`;
				setSearches((current) => ({
					...current,
					[key]: {
						query,
						open: true,
						loading: true,
						candidates: current[key]?.candidates ?? []
					}
				}));
				const existing = timers.current[key];
				if (existing !== void 0) clearTimeout(existing);
				timers.current[key] = setTimeout(() => {
					searchCatalog(globalFetch, query, SEARCH_LIMIT).then((answer) => {
						setSearches((current) => ({
							...current,
							[key]: {
								query,
								open: true,
								loading: false,
								candidates: answer.candidates
							}
						}));
					}).catch((failure) => {
						setSearches((current) => ({
							...current,
							[key]: {
								query,
								open: true,
								loading: false,
								candidates: [],
								error: explain(failure)
							}
						}));
					});
				}, SEARCH_DEBOUNCE_MS);
			}, []);
			/** Adopt one candidate as the mapping for a row, and close the picker. */
			const pick = (0, react.useCallback)((route, modelId, source) => {
				edit(route, modelId, source);
				const key = `${route}\u0000${modelId}`;
				const pending = timers.current[key];
				if (pending !== void 0) {
					clearTimeout(pending);
					delete timers.current[key];
				}
				setSearches((current) => ({
					...current,
					[key]: {
						query: source,
						open: false,
						loading: false,
						candidates: []
					}
				}));
			}, [edit]);
			/** Persist the draft, optionally running an apply pass in the same call. */
			const save = (0, react.useCallback)(async (apply) => {
				setSaving(true);
				setError(void 0);
				showMessage(void 0);
				try {
					const answer = await saveMapping(globalFetch, draft, apply, revision);
					setSaved(answer.mapping);
					setDraft(answer.mapping);
					if (answer.routes !== void 0) setReports(answer.routes);
					setRevision((current) => current);
					if (!apply) showMessage(translate("saved"), true);
					else if (answer.applyError !== void 0) showMessage(translate("savedApplyFailed", { reason: answer.applyError }));
					else {
						const pass = summarizePass(answer.applied ?? []);
						showMessage(pass.kind === "refused" ? translate("savedRefused", { route: pass.route ?? "" }) : pass.kind === "dry-run" ? translate("savedDryRun") : pass.kind === "unchanged" ? translate("savedNothing") : translate("savedApplied"), pass.kind !== "refused");
					}
					if (apply) {
						const next = await fetchInspect(globalFetch);
						setReports(next.reports);
						setResolved(next.resolved);
						setCatalogError(next.catalogError);
					}
				} catch (failure) {
					setError(explain(failure));
				} finally {
					setSaving(false);
				}
			}, [
				draft,
				revision,
				translate,
				showMessage
			]);
			/** Fold or unfold one route card; model rows keep their drafts while hidden. */
			const toggleRoute = (0, react.useCallback)((route) => {
				setCollapsedRoutes((current) => ({
					...current,
					[route]: current[route] !== true
				}));
			}, []);
			/** Close one row's picker without choosing a record. */
			const closeSearch = (0, react.useCallback)((route, modelId) => {
				const key = `${route}\u0000${modelId}`;
				const existing = timers.current[key];
				if (existing !== void 0) {
					clearTimeout(existing);
					delete timers.current[key];
				}
				setSearches((current) => ({
					...current,
					[key]: {
						query: current[key]?.query ?? "",
						open: false,
						loading: false,
						candidates: []
					}
				}));
			}, []);
			/** Run a pass over the saved mapping: every route, or just one. */
			const runPass = (0, react.useCallback)(async (route) => {
				setSaving(true);
				setError(void 0);
				showMessage(void 0);
				try {
					const answer = await applyNow(globalFetch, route);
					if (answer.routes !== void 0) setReports(answer.routes);
					const pass = summarizePass(answer.log);
					showMessage(pass.kind === "refused" ? translate("fillRefused") : pass.kind === "dry-run" ? translate("fillDryRun") : pass.kind === "applied" ? translate("applied") : translate("fillNothing"), pass.kind !== "refused");
				} catch (failure) {
					setError(explain(failure));
				} finally {
					setSaving(false);
				}
			}, [translate, showMessage]);
			const cards = (0, react.useMemo)(() => cardsFor(reports, draft, saved), [
				reports,
				draft,
				saved
			]);
			const coverage = (0, react.useMemo)(() => coverageOf(cards, status?.requireCompleteMapping !== false), [cards, status?.requireCompleteMapping]);
			const dirty = (0, react.useMemo)(() => !sameMapping(draft, saved), [draft, saved]);
			const info = {
				resolved,
				catalogProviderCount: status?.catalog?.providers,
				stale: status?.catalog?.stale,
				fromCache: status?.catalog?.fromCache,
				fetchedAt: formatFetchedAt(status?.catalog?.fetchedAt),
				catalogError,
				dryRun: status?.dryRun === true,
				builtinFormKept: true
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetadataView, {
				t: translate,
				loading,
				error,
				info,
				cards,
				coverage,
				dirty,
				saving,
				message,
				unmappedOnly,
				collapsedRoutes,
				searches,
				onReload: () => void load(),
				onInspect: () => void load(),
				onApplyAll: () => void runPass(),
				onApplyRoute: (route) => void runPass(route),
				onToggleUnmappedOnly: () => setUnmappedOnly((current) => !current),
				onToggleRoute: toggleRoute,
				onEdit: edit,
				onSearch: search,
				onCloseSearch: closeSearch,
				onPick: pick,
				onClear: (route, modelId) => edit(route, modelId, ""),
				onRemoveOrphan: (route, key) => edit(route, key, ""),
				onSave: (apply) => void save(apply)
			});
		}
		/**
		* A translator that falls back to the built-in dictionary.
		*
		* The slot kit binds `t` from the host's locale service, which resolves this
		* plugin's namespace. Anything it cannot answer — an unknown namespace, a key it
		* does not carry, an exception — falls back to the copy shipped in the bundle,
		* so the page never renders raw keys or dies on a locale problem.
		*/
		function makeTranslator(bound) {
			if (bound === void 0) return fallbackTranslate;
			return (key, params) => {
				try {
					const answer = bound(key, params);
					if (typeof answer === "string" && answer !== key && answer.length > 0) return answer;
				} catch {}
				return fallbackTranslate(key, params);
			};
		}
		/**
		* A render fault boundary around the page.
		*
		* The slot host wraps every registration in an error boundary, but it renders
		* nothing on failure: a fault in this page would appear as an empty settings
		* pane with no clue why. Catching it here keeps the diagnosis on screen and
		* points at the settings document, which always remains editable.
		*/
		var PageBoundary = class extends react.Component {
			state = {};
			/** Capture the message the next render should show. */
			static getDerivedStateFromError(failure) {
				return { failure: failure instanceof Error ? failure.message : String(failure) };
			}
			/** Log once, so the browser console carries the fault even if nobody reads it. */
			componentDidCatch(failure) {
				console.error("[dsh-autofill-model-metadata] settings page failed to render", failure);
			}
			render() {
				if (this.state.failure === void 0) return this.props.children;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						padding: 12,
						fontSize: 12,
						lineHeight: 1.6
					},
					role: "alert",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: { color: "rgb(200,80,80)" },
						children: this.props.t("crashed", { reason: this.state.failure })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							opacity: .75,
							marginTop: 4
						},
						children: this.props.t("crashedHint")
					})]
				});
			}
		};
		/** The built-in copy, used when the slot kit bound no translator. */
		let fallbackTranslate = (key) => String(key);
		/**
		* Install the built-in dictionary.
		*
		* Called by the plugin entry with the page's own copy so this module does not
		* depend on it directly; keeping the import out of the component graph also
		* keeps the pure view testable on its own.
		*/
		function setFallbackTranslator(translate) {
			fallbackTranslate = translate;
		}
		/** Turn any thrown value into something a person can read. */
		function explain(failure) {
			if (failure instanceof ApiError) return `${failure.status}: ${failure.message}`;
			if (failure instanceof Error) return failure.message;
			return String(failure);
		}
		//#endregion
		//#region src/client/index.tsx
		/** Must match the package name, the tsdown banner, and the loader row id. */
		const name = "dsh-autofill-model-metadata";
		/** Cordis client service names this half composes with. */
		const inject = ["slots", "locale"];
		/** The slot this page occupies: one row in the Settings navigation. */
		const SLOT = "settings.section";
		/** The id of this plugin's own Settings entry. */
		const SECTION_ID = "autofill-model-metadata";
		/** Where the entry sits among the built-in sections. */
		const SECTION_ORDER = 100;
		/**
		* The registered component: the page under its own render-fault boundary.
		*
		* The host's slot renderer already isolates a failing registration, but it shows
		* nothing when one fails — so this page carries its own boundary and turns any
		* fault into a readable message instead of an empty settings pane.
		*/
		function AutofillSection(props) {
			const t = props.t ?? makeT(void 0, en);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageBoundary, {
				t,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetadataPage, { ...props })
			});
		}
		/**
		* Tell the host the page loaded.
		*
		* Fire-and-forget: a failure here must not break the page, and an old host that
		* does not answer simply keeps its generated settings form.
		*/
		function reportLive(fetcher = (input, init) => fetch(input, init)) {
			fetcher(`${API_BASE}/page-live`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{}"
			}).then(() => void 0, () => void 0);
		}
		/** Mount the page. */
		function apply(ctx) {
			setFallbackTranslator(makeT(void 0, fallbackFor(ctx.locale?.getSnapshot?.().active)));
			const active = ctx.locale?.getSnapshot?.().active;
			const table = fallbackFor(active);
			let t = makeT(void 0, table);
			if (ctx.locale?.register !== void 0) {
				ctx.effect?.(() => {
					try {
						const dispose = ctx.locale?.register?.(COPY_NS, {
							zh,
							en
						});
						return typeof dispose === "function" ? dispose : void 0;
					} catch (failure) {
						ctx.logger?.warn?.(`${name}: locale dictionaries not re-registered`, failure);
						return;
					}
				}, `${name}: dictionaries`);
				const bound = ctx.locale.bind?.(COPY_NS);
				if (bound !== void 0) t = makeT(bound, table);
			}
			ctx.slots?.inject?.(SLOT, () => ctx.slots?.register?.({
				name: SLOT,
				id: SECTION_ID,
				order: SECTION_ORDER,
				label: () => t("nav"),
				locale: COPY_NS
			}, AutofillSection));
			ctx.effect?.(() => {
				reportLive();
			}, `${name}: announce the settings page`);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return exports;
	}
});
