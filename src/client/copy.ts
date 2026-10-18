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
export const COPY_NS = 'autofillModelMetadata'

/** Values a `{placeholder}` can be filled with. */
export type CopyParams = Record<string, string | number>

/** English copy. */
export const en = {
  nav: 'Model metadata',
  title: 'Model metadata autofill',
  intro: 'Fill capability fields of your own routes from models.dev, using the explicit mapping you declare.',
  loading: 'Loading…',
  reload: 'Reload',
  inspect: 'Check against catalog',
  applyAll: 'Fill now',
  catalog: 'Catalog',
  catalogProviders: '{count} providers',
  catalogFresh: 'living data',
  catalogCached: 'from cache',
  catalogStale: 'stale',
  catalogFetchedAt: 'fetched {when}',
  catalogUnavailable: 'The catalog could not be read: {reason}',
  catalogUnavailableHint: 'Mapping state is still shown; resolution needs the catalog.',
  noRoutes: 'No route has a mapping yet. Declare one in the settings document, or add entries below.',
  noModels: 'This route declares no models.',
  model: 'Model',
  declared: 'Declared',
  source: 'models.dev source',
  state: 'State',
  preview: 'What a pass would fill',
  actions: 'Actions',
  stateFilled: '{count} to fill',
  stateUnchanged: 'complete',
  stateMapped: 'mapped',
  stateUnmapped: 'unmapped',
  stateInvalid: 'invalid',
  summaryFilled: '{count} to fill',
  summaryUnchanged: '{count} complete',
  summaryMapped: '{count} mapped',
  summaryUnmapped: '{count} unmapped',
  summaryInvalid: '{count} invalid',
  summaryModels: '{count} models',
  nothingDeclared: 'nothing',
  clear: 'Clear',
  search: 'Search',
  searching: 'Searching…',
  searchHint: 'Search the catalog by model id or provider, then pick a record.',
  noCandidates: 'No catalog record matches.',
  unusable: 'not agent-capable',
  orphans: 'Mapping keys this route does not declare',
  remove: 'Remove',
  unmappedOnly: 'Only models without a mapping',
  save: 'Save mapping',
  saveApply: 'Save and fill',
  saving: 'Saving…',
  saved: 'Mapping saved.',
  savedApplied: 'Mapping saved and applied.',
  savedRefused: 'Mapping saved, but the pass refused {route} — see the refusals below.',
  savedApplyFailed: 'Mapping saved, but the fill failed: {reason}',
  savedDryRun: 'Mapping saved. Dry run is on, so nothing was written.',
  savedNothing: 'Mapping saved. Every mapped route was already complete.',
  applied: 'Pass complete.',
  failed: 'Failed: {reason}',
  dirty: 'unsaved changes',
  clean: 'saved',
  coverage: '{mapped}/{models} mapped, {unmapped} missing',
  blocked: '{routes} route(s) would be refused until every model is mapped',
  dryRun: 'Dry run is on: passes report without writing.',
  builtinFormKept: 'This deployment keeps the plugin config in the settings document; edit it there if this page is unusable.',
  neverOverwrites: 'Fields you declare by hand are never overwritten.',
  crashed: 'This settings page failed to render: {reason}',
  crashedHint: 'The plugin itself is unaffected. Edit the mapping in the settings document, then reload.',
}

/** Chinese copy. */
export const zh: typeof en = {
  nav: '模型元数据',
  title: '模型元数据补齐',
  intro: '按你显式声明的映射，从 models.dev 补齐自有路由的模型能力字段。',
  loading: '载入中…',
  reload: '重新载入',
  inspect: '对照目录检查',
  applyAll: '立即填充',
  catalog: '目录',
  catalogProviders: '{count} 个提供方',
  catalogFresh: '实时数据',
  catalogCached: '来自缓存',
  catalogStale: '缓存过期',
  catalogFetchedAt: '抓取于 {when}',
  catalogUnavailable: '无法读取目录：{reason}',
  catalogUnavailableHint: '映射状态仍会显示，但解析需要目录。',
  noRoutes: '还没有任何路由声明映射。可在配置文档中声明，或在下方添加。',
  noModels: '该路由没有声明任何模型。',
  model: '模型',
  declared: '已声明',
  source: 'models.dev 来源',
  state: '状态',
  preview: '将填充的字段',
  actions: '操作',
  stateFilled: '待填充',
  stateUnchanged: '已完整',
  stateMapped: '已映射',
  stateUnmapped: '未映射',
  stateInvalid: '无效',
  summaryFilled: '{count} 待填充',
  summaryUnchanged: '{count} 已完整',
  summaryMapped: '{count} 已映射',
  summaryUnmapped: '{count} 未映射',
  summaryInvalid: '{count} 无效',
  summaryModels: '{count} 个模型',
  nothingDeclared: '无',
  clear: '清除',
  search: '搜索',
  searching: '搜索中…',
  searchHint: '按模型 id 或提供方搜索目录，然后选择一条记录。',
  noCandidates: '目录中没有匹配的记录。',
  unusable: '非 agent 模型',
  orphans: '映射中该路由未声明的键',
  remove: '删除',
  unmappedOnly: '只看未映射的模型',
  save: '保存映射',
  saveApply: '保存并填充',
  saving: '保存中…',
  saved: '映射已保存。',
  savedApplied: '映射已保存并填充。',
  savedRefused: '映射已保存，但填充拒绝了 {route} —— 见下方拒绝原因。',
  savedApplyFailed: '映射已保存，但填充失败：{reason}',
  savedDryRun: '映射已保存。当前为试运行，没有写入任何内容。',
  savedNothing: '映射已保存。所有已映射路由本就完整。',
  applied: '填充完成。',
  failed: '失败：{reason}',
  dirty: '有未保存修改',
  clean: '已保存',
  coverage: '已映射 {mapped}/{models}，缺 {unmapped}',
  blocked: '有 {routes} 条路由在补齐全部模型前会被拒绝',
  dryRun: '当前为试运行：只报告，不写入。',
  builtinFormKept: '本部署把该插件配置存在设置文档里；本页不可用时可改为编辑它。',
  neverOverwrites: '你手写声明的字段永远不会被覆盖。',
  crashed: '本设置页渲染失败：{reason}',
  crashedHint: '插件本身不受影响。可在配置文档中编辑映射，然后重新载入。',
}

/** The translation function the component receives. */
export type Translate = (key: keyof typeof en, params?: CopyParams) => string

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
export function makeT(bound: unknown, fallback: typeof en = zh): Translate {
  return (key, params) => {
    const answered = readBound(bound, key, params)
    return answered ?? interpolate(fallback[key], params)
  }
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
export function fallbackFor(active: unknown): typeof en {
  return typeof active === 'string' && active.toLowerCase().startsWith('en') ? en : zh
}

/** Ask the bound translator, treating an echoed key or a non-string as absent. */
function readBound(bound: unknown, key: string, params?: CopyParams): string | undefined {
  if (typeof bound !== 'function') return undefined
  try {
    const answer = (bound as (key: string, params?: CopyParams) => unknown)(key, params)
    return typeof answer === 'string' && answer !== key ? answer : undefined
  } catch {
    // A namespace the service does not know must not take the page down.
    return undefined
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
export function interpolate(template: string, params?: CopyParams): string {
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}
