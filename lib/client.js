window.__ModuleLoader__.load({
	id: "dsh-autofill-model-metadata",
	factory: (require) => {
		var exports = { exports: {} }.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
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
			intro: "Fill capability fields of your own routes from models.dev, using the explicit mapping you declare.",
			loading: "Loading…",
			reload: "Reload",
			inspect: "Check against catalog",
			applyAll: "Fill now",
			catalog: "Catalog",
			catalogProviders: "{count} providers",
			catalogFresh: "living data",
			catalogCached: "from cache",
			catalogStale: "stale",
			catalogFetchedAt: "fetched {when}",
			catalogUnavailable: "The catalog could not be read: {reason}",
			catalogUnavailableHint: "Mapping state is still shown; resolution needs the catalog.",
			noRoutes: "No route has a mapping yet. Declare one in the settings document, or add entries below.",
			noModels: "This route declares no models.",
			model: "Model",
			declared: "Declared",
			source: "models.dev source",
			state: "State",
			preview: "What a pass would fill",
			actions: "Actions",
			stateFilled: "{count} to fill",
			stateUnchanged: "complete",
			stateMapped: "mapped",
			stateUnmapped: "unmapped",
			stateInvalid: "invalid",
			summaryFilled: "{count} to fill",
			summaryUnchanged: "{count} complete",
			summaryMapped: "{count} mapped",
			summaryUnmapped: "{count} unmapped",
			summaryInvalid: "{count} invalid",
			summaryModels: "{count} models",
			nothingDeclared: "nothing",
			clear: "Clear",
			search: "Search",
			searching: "Searching…",
			searchHint: "Search the catalog by model id or provider, then pick a record.",
			noCandidates: "No catalog record matches.",
			unusable: "not agent-capable",
			orphans: "Mapping keys this route does not declare",
			remove: "Remove",
			unmappedOnly: "Only models without a mapping",
			save: "Save mapping",
			saveApply: "Save and fill",
			saving: "Saving…",
			saved: "Mapping saved.",
			savedApplied: "Mapping saved and applied.",
			savedRefused: "Mapping saved, but the pass refused {route} — see the refusals below.",
			savedApplyFailed: "Mapping saved, but the fill failed: {reason}",
			savedDryRun: "Mapping saved. Dry run is on, so nothing was written.",
			savedNothing: "Mapping saved. Every mapped route was already complete.",
			applied: "Pass complete.",
			failed: "Failed: {reason}",
			dirty: "unsaved changes",
			clean: "saved",
			coverage: "{mapped}/{models} mapped, {unmapped} missing",
			blocked: "{routes} route(s) would be refused until every model is mapped",
			dryRun: "Dry run is on: passes report without writing.",
			builtinFormKept: "This deployment keeps the plugin config in the settings document; edit it there if this page is unusable.",
			neverOverwrites: "Fields you declare by hand are never overwritten.",
			crashed: "This settings page failed to render: {reason}",
			crashedHint: "The plugin itself is unaffected. Edit the mapping in the settings document, then reload."
		};
		/** Chinese copy. */
		const zh = {
			nav: "模型元数据",
			title: "模型元数据补齐",
			intro: "按你显式声明的映射，从 models.dev 补齐自有路由的模型能力字段。",
			loading: "载入中…",
			reload: "重新载入",
			inspect: "对照目录检查",
			applyAll: "立即填充",
			catalog: "目录",
			catalogProviders: "{count} 个提供方",
			catalogFresh: "实时数据",
			catalogCached: "来自缓存",
			catalogStale: "缓存过期",
			catalogFetchedAt: "抓取于 {when}",
			catalogUnavailable: "无法读取目录：{reason}",
			catalogUnavailableHint: "映射状态仍会显示，但解析需要目录。",
			noRoutes: "还没有任何路由声明映射。可在配置文档中声明，或在下方添加。",
			noModels: "该路由没有声明任何模型。",
			model: "模型",
			declared: "已声明",
			source: "models.dev 来源",
			state: "状态",
			preview: "将填充的字段",
			actions: "操作",
			stateFilled: "待填充",
			stateUnchanged: "已完整",
			stateMapped: "已映射",
			stateUnmapped: "未映射",
			stateInvalid: "无效",
			summaryFilled: "{count} 待填充",
			summaryUnchanged: "{count} 已完整",
			summaryMapped: "{count} 已映射",
			summaryUnmapped: "{count} 未映射",
			summaryInvalid: "{count} 无效",
			summaryModels: "{count} 个模型",
			nothingDeclared: "无",
			clear: "清除",
			search: "搜索",
			searching: "搜索中…",
			searchHint: "按模型 id 或提供方搜索目录，然后选择一条记录。",
			noCandidates: "目录中没有匹配的记录。",
			unusable: "非 agent 模型",
			orphans: "映射中该路由未声明的键",
			remove: "删除",
			unmappedOnly: "只看未映射的模型",
			save: "保存映射",
			saveApply: "保存并填充",
			saving: "保存中…",
			saved: "映射已保存。",
			savedApplied: "映射已保存并填充。",
			savedRefused: "映射已保存，但填充拒绝了 {route} —— 见下方拒绝原因。",
			savedApplyFailed: "映射已保存，但填充失败：{reason}",
			savedDryRun: "映射已保存。当前为试运行，没有写入任何内容。",
			savedNothing: "映射已保存。所有已映射路由本就完整。",
			applied: "填充完成。",
			failed: "失败：{reason}",
			dirty: "有未保存修改",
			clean: "已保存",
			coverage: "已映射 {mapped}/{models}，缺 {unmapped}",
			blocked: "有 {routes} 条路由在补齐全部模型前会被拒绝",
			dryRun: "当前为试运行：只报告，不写入。",
			builtinFormKept: "本部署把该插件配置存在设置文档里；本页不可用时可改为编辑它。",
			neverOverwrites: "你手写声明的字段永远不会被覆盖。",
			crashed: "本设置页渲染失败：{reason}",
			crashedHint: "插件本身不受影响。可在配置文档中编辑映射，然后重新载入。"
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
		/** The one-line description of a candidate in the picker. */
		function describeCandidate(candidate) {
			const bits = [candidate.source];
			if (candidate.name !== void 0 && candidate.name !== candidate.model) bits.push(candidate.name);
			const context = formatTokens(candidate.contextWindow);
			const output = formatTokens(candidate.maxTokens);
			if (context !== void 0) bits.push(`ctx ${context}`);
			if (output !== void 0) bits.push(`out ${output}`);
			if (candidate.effortLevels !== void 0) bits.push(candidate.effortLevels.join("/"));
			if (!candidate.usable && candidate.problem !== void 0) bits.push(`✗ ${candidate.problem}`);
			return bits.join(" · ");
		}
		/** One line per filled field, for the preview under a row. */
		function describeFilled(filled) {
			return Object.entries(filled).map(([field, value]) => `${field}: ${summarizeValue(value)}`);
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
				case "mapped": return "ok";
				default: return "warn";
			}
		}
		//#endregion
		//#region src/client/view.tsx
		/** Layout constants, so the page looks deliberate rather than unstyled. */
		const S = {
			root: {
				display: "flex",
				flexDirection: "column",
				gap: 14,
				padding: "4px 2px 8px",
				color: "inherit",
				maxWidth: "100%",
				minWidth: 0,
				boxSizing: "border-box"
			},
			h2: {
				margin: 0,
				fontSize: 16,
				fontWeight: 600
			},
			intro: {
				margin: "2px 0 0",
				fontSize: 12,
				opacity: .7,
				lineHeight: 1.5
			},
			bar: {
				display: "flex",
				flexWrap: "wrap",
				gap: 8,
				alignItems: "center"
			},
			meta: {
				fontSize: 12,
				opacity: .75
			},
			card: {
				border: "1px solid rgba(128,128,128,0.28)",
				borderRadius: 10,
				padding: "10px 12px 12px",
				display: "flex",
				flexDirection: "column",
				gap: 8,
				minWidth: 0,
				maxWidth: "100%",
				boxSizing: "border-box"
			},
			cardHead: {
				display: "flex",
				alignItems: "baseline",
				gap: 8,
				flexWrap: "wrap"
			},
			cardTitle: {
				fontSize: 13,
				fontWeight: 600
			},
			dim: {
				fontSize: 12,
				opacity: .7
			},
			tableWrap: {
				width: "100%",
				maxWidth: "100%",
				minWidth: 0,
				overflowX: "auto"
			},
			table: {
				width: "100%",
				tableLayout: "fixed",
				borderCollapse: "collapse",
				fontSize: 12
			},
			th: {
				textAlign: "left",
				fontWeight: 500,
				opacity: .6,
				padding: "4px 8px 4px 0",
				borderBottom: "1px solid rgba(128,128,128,0.22)",
				overflowWrap: "anywhere"
			},
			td: {
				padding: "6px 8px 6px 0",
				verticalAlign: "top",
				overflowWrap: "anywhere",
				minWidth: 0
			},
			input: {
				font: "inherit",
				fontSize: 12,
				color: "inherit",
				background: "transparent",
				border: "1px solid rgba(128,128,128,0.4)",
				borderRadius: 6,
				padding: "3px 6px",
				width: "100%",
				boxSizing: "border-box"
			},
			candidates: {
				marginTop: 4,
				border: "1px solid rgba(128,128,128,0.28)",
				borderRadius: 8,
				maxHeight: 200,
				overflow: "auto",
				background: "rgba(128,128,128,0.06)"
			},
			candidate: {
				display: "block",
				width: "100%",
				textAlign: "left",
				border: "none",
				background: "transparent",
				color: "inherit",
				font: "inherit",
				fontSize: 12,
				padding: "5px 8px",
				cursor: "pointer"
			},
			banner: {
				border: "1px solid rgba(128,128,128,0.3)",
				borderRadius: 8,
				padding: "8px 10px",
				fontSize: 12,
				lineHeight: 1.5,
				background: "rgba(128,128,128,0.08)"
			},
			footer: {
				display: "flex",
				flexWrap: "wrap",
				gap: 8,
				alignItems: "center",
				borderTop: "1px solid rgba(128,128,128,0.22)",
				paddingTop: 10
			},
			mono: {
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
				fontSize: 11.5
			},
			fields: {
				display: "flex",
				flexWrap: "wrap",
				gap: "0 6px",
				opacity: .7
			},
			pick: {
				border: "none",
				background: "transparent",
				color: "inherit",
				cursor: "pointer",
				fontSize: 11,
				textDecoration: "underline",
				padding: 0
			}
		};
		/** The colour of a state badge. */
		function toneStyle(tone) {
			switch (tone) {
				case "ok": return { background: "rgba(48,164,108,0.18)" };
				case "info": return { background: "rgba(64,120,216,0.18)" };
				case "bad": return { background: "rgba(216,72,72,0.18)" };
				default: return { background: "rgba(200,140,40,0.20)" };
			}
		}
		/** A small pill. */
		function Badge({ text, tone }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					...toneStyle(tone),
					borderRadius: 999,
					padding: "1px 8px",
					fontSize: 11,
					whiteSpace: "nowrap"
				},
				children: text
			});
		}
		/** One row: the mapping editor for a single declared model. */
		function Row(props) {
			const { row, t, search } = props;
			const key = rowKey(row.route, row.modelId);
			const filled = describeFilled(row.filled);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
					style: {
						...S.td,
						...S.mono
					},
					children: row.modelId
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
					style: S.td,
					children: row.declared.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.dim,
						children: t("nothingDeclared")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.fields,
						children: row.declared.map((field) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: field }, field))
					})
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
					style: {
						...S.td,
						minWidth: 190
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						style: S.input,
						value: row.source ?? "",
						placeholder: "provider/model",
						"aria-label": `${row.modelId} ${t("source")}`,
						onChange: (event) => props.onEdit(row.route, row.modelId, event.target.value),
						onKeyDown: (event) => {
							if (event.key === "Enter") props.onSearch(row.route, row.modelId, row.source ?? row.modelId);
						}
					})
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
					style: S.td,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Badge, {
						text: t(stateKey(row.state), { count: 1 }),
						tone: stateTone(row.state)
					}), row.edited ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							...S.dim,
							marginLeft: 6
						},
						children: t("dirty")
					}) : null]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
					style: S.td,
					children: [filled.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: S.dim,
						children: "—"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: filled.map((line) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: S.mono,
							children: line
						}, line))
					}), row.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...S.dim,
							color: "rgb(200,80,80)"
						},
						children: [
							row.error.kind,
							": ",
							row.error.message
						]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
					style: S.td,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: S.pick,
						onClick: () => props.onSearch(row.route, row.modelId, row.source ?? row.modelId),
						children: search?.loading === true ? t("searching") : t("search")
					}), row.source === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: S.pick,
						onClick: () => props.onClear(row.route, row.modelId),
						children: t("clear")
					}) })]
				})
			] }), search?.open !== true ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { style: S.td }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
				style: S.td,
				colSpan: 5,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					style: {
						...S.input,
						maxWidth: 420
					},
					value: search.query,
					placeholder: t("searchHint"),
					"aria-label": `${row.modelId} ${t("search")}`,
					onChange: (event) => props.onSearch(row.route, row.modelId, event.target.value),
					autoFocus: true
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: S.candidates,
					children: [
						search.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.dim,
								padding: "6px 8px"
							},
							children: search.error
						}),
						search.loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.dim,
								padding: "6px 8px"
							},
							children: t("searching")
						}) : null,
						!search.loading && search.error === void 0 && search.candidates.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								...S.dim,
								padding: "6px 8px"
							},
							children: t("noCandidates")
						}) : null,
						search.candidates.map((candidate) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: S.candidate,
							title: candidate.usable ? candidate.source : `${candidate.source} — ${candidate.problem ?? t("unusable")}`,
							onClick: () => props.onPick(row.route, row.modelId, candidate.source),
							children: describeCandidate(candidate)
						}, candidate.source))
					]
				})]
			})] }, `${key}-search`)] });
		}
		/** One route card. */
		function Card(props) {
			const { card, t } = props;
			const rows = props.unmappedOnly ? card.rows.filter((row) => row.source === void 0) : card.rows;
			if (props.unmappedOnly && rows.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				style: S.card,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.cardHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.cardTitle,
								children: card.displayName
							}),
							card.displayName === card.route ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									...S.dim,
									...S.mono
								},
								children: card.route
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.dim,
								children: summaryParts(card.counts).map((part) => t(part.key, { count: part.count })).join(" · ")
							}),
							card.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Badge, {
								text: t("applyAll"),
								tone: "info"
							}) : null
						]
					}),
					card.reason === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: card.reason
					}),
					rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: t("noModels")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.tableWrap,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
							style: S.table,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("colgroup", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "24%" } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "18%" } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "26%" } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "11%" } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "11%" } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("col", { style: { width: "10%" } })
								] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("model")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("declared")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("source")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("state")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("preview")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
										style: S.th,
										children: t("actions")
									})
								] }) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Row, {
									row,
									t,
									search: props.searches[rowKey(row.route, row.modelId)],
									onEdit: props.actions.onEdit,
									onSearch: props.actions.onSearch,
									onPick: props.actions.onPick,
									onClear: props.actions.onClear
								}, rowKey(row.route, row.modelId))) })
							]
						})
					}),
					card.orphans.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.dim,
						children: [
							t("orphans"),
							":",
							" ",
							card.orphans.map((orphan) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: { marginRight: 8 },
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: S.mono,
										children: orphan
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: S.pick,
										onClick: () => props.actions.onRemoveOrphan(card.route, orphan),
										children: t("remove")
									})
								]
							}, orphan))
						]
					}),
					card.errors.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: card.errors.map((error, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: { color: "rgb(200,80,80)" },
							children: [
								error.kind,
								": ",
								error.message
							]
						}, `${error.kind}-${index}`))
					})
				]
			});
		}
		/** The whole page. */
		function MetadataView(props) {
			const { t, info, coverage } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: S.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						style: S.h2,
						children: t("title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: S.intro,
						children: t("intro")
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.bar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: props.onReload,
								disabled: props.loading,
								children: t("reload")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: props.onInspect,
								disabled: props.loading || props.saving,
								children: t("inspect")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: props.onApplyAll,
								disabled: props.loading || props.saving || props.dirty,
								children: t("applyAll")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									...S.meta,
									display: "flex",
									gap: 6,
									alignItems: "center"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: props.unmappedOnly,
									onChange: props.onToggleUnmappedOnly
								}), t("unmappedOnly")]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.meta,
						children: [
							t("catalog"),
							":",
							" ",
							info.catalogProviderCount === void 0 ? "—" : [
								t("catalogProviders", { count: info.catalogProviderCount }),
								info.stale ? t("catalogStale") : info.fromCache ? t("catalogCached") : t("catalogFresh"),
								info.fetchedAt === void 0 ? void 0 : t("catalogFetchedAt", { when: info.fetchedAt })
							].filter((part) => part !== void 0).join(" · "),
							" · ",
							t("coverage", {
								mapped: coverage.mapped,
								models: coverage.models,
								unmapped: coverage.unmapped
							}),
							info.dryRun ? ` · ${t("dryRun")}` : ""
						]
					}),
					props.error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.banner,
						role: "alert",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("failed", { reason: props.error }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: { marginTop: 4 },
							children: t("builtinFormKept")
						})]
					}),
					info.resolved ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: S.banner,
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: info.catalogError === void 0 ? t("loading") : t("catalogUnavailable", { reason: info.catalogError }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								marginTop: 4,
								opacity: .75
							},
							children: t("catalogUnavailableHint")
						})]
					}),
					coverage.blockedRoutes > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.banner,
						role: "status",
						children: t("blocked", { routes: coverage.blockedRoutes })
					}) : null,
					props.loading && props.cards.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: t("loading")
					}) : null,
					!props.loading && props.cards.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: S.dim,
						children: t("noRoutes")
					}) : null,
					props.cards.map((card) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Card, {
						card,
						t,
						searches: props.searches,
						unmappedOnly: props.unmappedOnly,
						actions: props
					}, card.route)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						style: S.footer,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: () => props.onSave(false),
								disabled: props.saving || !props.dirty,
								children: props.saving ? t("saving") : t("save")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: () => props.onSave(true),
								disabled: props.saving || coverage.blockedRoutes > 0,
								children: t("saveApply")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.meta,
								children: props.dirty ? t("dirty") : t("clean")
							}),
							props.message === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: S.meta,
								role: "status",
								children: props.message
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: {
									...S.meta,
									marginLeft: "auto"
								},
								children: t("neverOverwrites")
							})
						]
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
				setMessage(void 0);
				try {
					const answer = await saveMapping(globalFetch, draft, apply, revision);
					setSaved(answer.mapping);
					setDraft(answer.mapping);
					if (answer.routes !== void 0) setReports(answer.routes);
					setRevision((current) => current);
					if (!apply) setMessage(translate("saved"));
					else if (answer.applyError !== void 0) setMessage(translate("savedApplyFailed", { reason: answer.applyError }));
					else {
						const pass = summarizePass(answer.applied ?? []);
						setMessage(pass.kind === "refused" ? translate("savedRefused", { route: pass.route ?? "" }) : pass.kind === "dry-run" ? translate("savedDryRun") : pass.kind === "unchanged" ? translate("savedNothing") : translate("savedApplied"));
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
				translate
			]);
			/** Run a pass over the saved mapping. */
			const applyAll = (0, react.useCallback)(async () => {
				setSaving(true);
				setError(void 0);
				setMessage(void 0);
				try {
					const answer = await applyNow(globalFetch);
					if (answer.routes !== void 0) setReports(answer.routes);
					setMessage(answer.log.length === 0 ? translate("applied") : answer.log.join(" | "));
				} catch (failure) {
					setError(explain(failure));
				} finally {
					setSaving(false);
				}
			}, [translate]);
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
				searches,
				onReload: () => void load(),
				onInspect: () => void load(),
				onApplyAll: () => void applyAll(),
				onToggleUnmappedOnly: () => setUnmappedOnly((current) => !current),
				onEdit: edit,
				onSearch: search,
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
					ctx.locale?.register?.(COPY_NS, {
						zh,
						en
					});
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
