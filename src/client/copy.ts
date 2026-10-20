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
  intro: 'Fill the capability fields of your own routes from the models.dev record you map to each model.',
  loading: 'Loading…',
  reload: 'Reload',
  inspect: 'Check mappings',
  applyAll: 'Fill all models',
  catalog: 'Catalog',
  catalogProviders: '{count} providers',
  catalogFresh: 'up to date',
  catalogCached: 'from cache',
  catalogStale: 'expired',
  catalogFetchedAt: 'updated {when}',
  catalogUnavailable: 'The catalog could not be read: {reason}',
  catalogUnavailableHint: 'Mappings stay editable, but catalog records cannot be checked right now.',
  noRoutes: 'There are no routes to map yet. Add a custom provider and its models under Settings → Models first.',
  noModels: 'This route declares no models.',
  noUnmapped: 'No unmapped models — every declared model already has a models.dev mapping.',
  model: 'Model',
  declared: 'Declared',
  declaredCount: '{count} fields declared',
  source: 'models.dev source',
  state: 'State',
  preview: 'What a pass would fill',
  actions: 'Actions',
  stateFilled: 'to fill',
  stateUnchanged: 'up to date',
  stateMapped: 'mapped',
  stateUnmapped: 'unmapped',
  stateInvalid: 'invalid mapping',
  fillRoute: 'Fill this route',
  expandRoute: 'Expand route',
  collapseRoute: 'Collapse route',
  willFill: 'Would fill',
  dirtyTag: 'Unsaved',
  cancel: 'Cancel',
  summaryFilled: '{count} to fill',
  summaryUnchanged: '{count} up to date',
  summaryMapped: '{count} mapped',
  summaryUnmapped: '{count} unmapped',
  summaryInvalid: '{count} invalid',
  summaryModels: '{count} models',
  nothingDeclared: 'no declared fields',
  clear: 'Clear mapping',
  search: 'Search catalog',
  searching: 'Searching…',
  searchHint: 'Search by model ID or provider, then pick a models.dev record.',
  noCandidates: 'No matching models.',
  unusable: 'no tool calling',
  orphans: 'Mappings for models this route does not declare',
  remove: 'Remove mapping',
  unmappedOnly: 'Only unmapped models',
  save: 'Save mapping',
  saveApply: 'Save and fill',
  saving: 'Saving…',
  saved: 'Mapping saved.',
  savedApplied: 'Mapping saved and filled.',
  savedRefused: 'Mapping saved, but {route} was not filled — see the reasons below.',
  savedApplyFailed: 'Mapping saved, but the fill failed: {reason}',
  savedDryRun: 'Mapping saved. Dry run mode does not write the configuration.',
  savedNothing: 'Mapping saved. Every mapping is already up to date.',
  applied: 'Fill pass complete.',
  fillDryRun: 'Dry run: nothing was written.',
  fillNothing: 'Nothing needed filling.',
  fillRefused: 'Some routes could not be filled — see the reasons below.',
  failed: 'Failed: {reason}',
  dirty: 'unsaved changes',
  clean: 'saved',
  coverage: '{mapped}/{models} models mapped',
  blocked: '{routes} route(s) still have unmapped models; fill them before saving and filling.',
  dryRun: 'Dry run: only reports results, does not write the configuration.',
  builtinFormKept: 'This configuration page is unavailable. Edit the plugin config, or reload the page.',
  neverOverwrites: 'Fields you declare by hand are never overwritten automatically.',
  crashed: 'This settings page failed to render: {reason}',
  crashedHint: 'The plugin itself is still running. Edit the mapping in the plugin config, or reload the page.',
}

/** Chinese copy. */
export const zh: typeof en = {
  nav: '模型元数据',
  title: '模型元数据补齐',
  intro: '用你指定的 models.dev 记录，为自己路由中的每个模型补齐能力参数。',
  loading: '加载中…',
  reload: '重新加载',
  inspect: '校验映射',
  applyAll: '填充全部模型',
  catalog: '目录',
  catalogProviders: '{count} 个提供商',
  catalogFresh: '最新数据',
  catalogCached: '来自缓存',
  catalogStale: '数据已过期',
  catalogFetchedAt: '更新于 {when}',
  catalogUnavailable: '无法读取目录：{reason}',
  catalogUnavailableHint: '映射仍可编辑，但暂时无法校验目录记录。',
  noRoutes: '当前配置里还没有可映射的路由。请先在「设置 → 模型」中添加自定义提供商和模型。',
  noModels: '该路由没有声明任何模型。',
  noUnmapped: '没有未映射的模型 —— 所有已声明的模型都已有 models.dev 映射。',
  model: '模型',
  declared: '已声明',
  declaredCount: '已声明 {count} 个字段',
  source: 'models.dev 来源',
  state: '状态',
  preview: '将填充的字段',
  actions: '操作',
  stateFilled: '待填充',
  stateUnchanged: '无需填充',
  stateMapped: '已映射',
  stateUnmapped: '未映射',
  stateInvalid: '映射无效',
  fillRoute: '填充此路由',
  expandRoute: '展开模型列表',
  collapseRoute: '收起模型列表',
  willFill: '将填充',
  dirtyTag: '未保存',
  cancel: '取消',
  summaryFilled: '{count} 个待填充',
  summaryUnchanged: '{count} 个无需填充',
  summaryMapped: '{count} 个已映射',
  summaryUnmapped: '{count} 个未映射',
  summaryInvalid: '{count} 个无效',
  summaryModels: '{count} 个模型',
  nothingDeclared: '未声明字段',
  clear: '清除映射',
  search: '搜索目录',
  searching: '正在搜索…',
  searchHint: '搜索模型 ID 或提供商，选择一条 models.dev 记录。',
  noCandidates: '没有匹配的模型记录。',
  unusable: '不支持工具调用',
  orphans: '这些映射指向该路由未声明的模型',
  remove: '移除映射',
  unmappedOnly: '仅显示未映射模型',
  save: '保存映射',
  saveApply: '保存并填充',
  saving: '保存中…',
  saved: '映射已保存。',
  savedApplied: '映射已保存并填充。',
  savedRefused: '映射已保存，但 {route} 未能填充，原因见下方。',
  savedApplyFailed: '映射已保存，但填充失败：{reason}',
  savedDryRun: '映射已保存。试运行模式不会写入配置。',
  savedNothing: '映射已保存。所有映射均无需填充。',
  applied: '填充完成。',
  fillDryRun: '试运行中：未写入配置。',
  fillNothing: '所有映射均无需填充。',
  fillRefused: '有路由未能填充，原因见下方。',
  failed: '失败：{reason}',
  dirty: '有未保存修改',
  clean: '已保存',
  coverage: '{mapped}/{models} 个模型已映射',
  blocked: '有 {routes} 条路由还有模型未映射，补齐后才能保存并填充。',
  dryRun: '试运行中：仅报告结果，不会写入配置。',
  builtinFormKept: '配置页暂时不可用。可先编辑插件配置，或重新加载页面。',
  neverOverwrites: '手工声明的字段不会被自动覆盖。',
  crashed: '配置页渲染失败：{reason}',
  crashedHint: '插件仍在运行。可在插件配置中编辑映射，或重新加载页面。',
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
