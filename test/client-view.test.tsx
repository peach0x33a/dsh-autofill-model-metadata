import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ReportedRoute } from '../src/client/api.ts'
import { COPY_NS, makeT, zh } from '../src/client/copy.ts'
import { cardsFor, coverageOf, type Mapping } from '../src/client/model.ts'
import { MetadataView, type ViewProps } from '../src/client/view.tsx'
import { platformTranslator } from './stubs/locale.ts'

/**
 * The translator the page really gets: the host's locale service, with this
 * plugin's dictionary registered. Routing the render tests through it is what
 * keeps a dictionary the platform cannot read from going unnoticed.
 */
const t = makeT(platformTranslator({ [COPY_NS]: zh })(COPY_NS))

/** The route this test page shows: one fillable, one gap, one bad source. */
const REPORT: ReportedRoute = {
  route: 'my-gateway',
  displayName: 'gzz',
  settingsNs: 'llm-pi-ai',
  configured: true,
  mapped: true,
  resolved: true,
  orphans: ['typo-key'],
  errors: [],
  counts: { models: 3, mapped: 0, filled: 2, unchanged: 0, unmapped: 1, invalid: 0 },
  models: [
    {
      id: 'gemini-3.8-flash',
      declared: ['name'],
      source: 'google/gemini-3.8-flash',
      state: 'filled',
      filled: { contextWindow: 1048576, maxTokens: 65536 },
    },
    { id: 'step-3.7-flash', declared: [], state: 'unmapped', filled: {} },
    { id: 'deepseek/deepseek-v4.1-flash', declared: [], state: 'unmapped', filled: {} },
  ],
}

/**
 * What the host holds. It has to agree with {@link REPORT}: the orphan and the
 * undeclared-mapping refusal below describe *this* table, so a draft seeded from
 * it must carry the same keys.
 */
const SAVED: Mapping = {
  'my-gateway': { 'gemini-3.8-flash': 'google/gemini-3.8-flash', 'typo-key': 'openai/gpt-4o' },
}

/** The enclosing tag of the first element whose text is `label`. */
function tagAround(html: string, label: string): string {
  const at = html.indexOf(label)
  if (at === -1) throw new Error(`no element contains ${label}`)
  return html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1)
}

/** Render the view with sensible defaults, overridden per test. */
function render(overrides: Partial<ViewProps> & { draft?: Mapping } = {}): string {
  const cards = cardsFor([REPORT], overrides.draft ?? SAVED, SAVED)
  const props: ViewProps = {
    t,
    loading: false,
    info: {
      resolved: true,
      catalogProviderCount: 226,
      fromCache: true,
      fetchedAt: '2026/1/1 00:00:00',
      dryRun: false,
      builtinFormKept: true,
    },
    cards,
    coverage: coverageOf(cards),
    dirty: false,
    saving: false,
    unmappedOnly: false,
    searches: {},
    onReload: () => undefined,
    onInspect: () => undefined,
    onApplyAll: () => undefined,
    onToggleUnmappedOnly: () => undefined,
    onEdit: () => undefined,
    onSearch: () => undefined,
    onPick: () => undefined,
    onClear: () => undefined,
    onRemoveOrphan: () => undefined,
    onSave: () => undefined,
    ...overrides,
  }
  return renderToStaticMarkup(<MetadataView {...props} />)
}

describe('MetadataView', () => {
  it('renders the page, the route, and every declared model', () => {
    const html = render()
    expect(html).toContain('模型元数据补齐')
    expect(html).toContain('gzz')
    expect(html).toContain('gemini-3.8-flash')
    expect(html).toContain('step-3.7-flash')
    expect(html).toContain('deepseek/deepseek-v4.1-flash')
  })

  it('shows the mapping in an editable field and what a pass would fill', () => {
    const html = render()
    expect(html).toContain('value="google/gemini-3.8-flash"')
    expect(html).toContain('contextWindow: 1048576')
    expect(html).toContain('maxTokens: 65536')
    // Declared fields are listed, so the operator can see what is protected.
    expect(html).toContain('name')
  })

  it('marks unmapped models and reports the refusal they cause', () => {
    const html = render()
    expect(html).toContain('未映射')
    expect(html).toContain('有 1 条路由在补齐全部模型前会被拒绝')
  })

  it('surfaces mapping keys the route does not declare, with a way to remove them', () => {
    const html = render()
    expect(html).toContain('映射中该路由未声明的键')
    expect(html).toContain('typo-key')
    expect(html).toContain('删除')
  })

  it('gates a route that has no gap once the draft fills it and drops the typo', () => {
    // Exactly what the operator would end up with: every model mapped, and the
    // key the route does not declare removed rather than left in place.
    const draft: Mapping = {
      'my-gateway': {
        'gemini-3.8-flash': 'google/gemini-3.8-flash',
        'step-3.7-flash': 'stepfun/step-3.7-flash',
        'deepseek/deepseek-v4.1-flash': 'deepseek/deepseek-flash',
      },
    }
    const html = render({ draft, dirty: true })
    expect(html).not.toContain('会被拒绝')
    expect(html).toContain('有未保存修改')
    expect(html).toContain('已映射 3/3，缺 0')
  })

  it('offers catalog candidates for the row being edited, and marks unusable ones', () => {
    const html = render({
      searches: {
        'my-gateway\u0000step-3.7-flash': {
          query: 'step',
          open: true,
          loading: false,
          candidates: [
            {
              source: 'stepfun/step-3.7-flash',
              provider: 'stepfun',
              model: 'step-3.7-flash',
              contextWindow: 256000,
              maxTokens: 256000,
              toolCall: true,
              usable: true,
            },
            {
              source: 'stepfun/step-embed',
              provider: 'stepfun',
              model: 'step-embed',
              toolCall: false,
              usable: false,
              problem: 'tool_call=false',
            },
          ],
        },
      },
    })
    expect(html).toContain('stepfun/step-3.7-flash')
    expect(html).toContain('ctx 256K')
    expect(html).toContain('✗ tool_call=false')
  })

  it('renders a failed whole-page call with the way back to stock settings', () => {
    const html = render({ error: '503: no host half' })
    expect(html).toContain('失败：503: no host half')
    // The fallback sentence is the point of this banner: it names the surface
    // that always works, since 0.2.0-rc.2 renders no generated form.
    expect(html).toContain('本部署把该插件配置存在设置文档里')
  })

  it('explains an unreachable catalog without hiding the mapping', () => {
    const html = render({
      info: {
        resolved: false,
        catalogError: 'ENOTFOUND',
        dryRun: false,
        builtinFormKept: true,
      },
    })
    expect(html).toContain('无法读取目录：ENOTFOUND')
    expect(html).toContain('映射状态仍会显示')
  })

  it('filters to unmapped models only', () => {
    const html = render({ unmappedOnly: true })
    expect(html).not.toContain('value="google/gemini-3.8-flash"')
    expect(html).toContain('step-3.7-flash')
  })

  it('shows a dry run, a save result, and the footer actions', () => {
    const html = render({
      dirty: true,
      message: '映射已保存。',
      info: {
        resolved: true,
        catalogProviderCount: 226,
        dryRun: true,
        builtinFormKept: true,
      },
    })
    expect(html).toContain('当前为试运行：只报告，不写入。')
    expect(html).toContain('映射已保存。')
    expect(html).toContain('保存映射')
    expect(html).toContain('保存并填充')
    expect(html).toContain('你手写声明的字段永远不会被覆盖。')
  })

  it('says so when there is nothing to show yet', () => {
    expect(render({ loading: true, cards: [], coverage: coverageOf([]) })).toContain('载入中…')
    const empty = render({ cards: [], coverage: coverageOf([]) })
    expect(empty).toContain('还没有任何路由声明映射')
  })

  it('keeps the apply button unavailable while edits are unsaved', () => {
    // "Fill now" runs the *saved* mapping, so letting it fire with a draft on
    // screen would apply something other than what the operator sees; the
    // save-and-fill button is the one that carries the edits.
    expect(tagAround(render({ dirty: true, draft: {} }), '立即填充')).toContain('disabled')
    expect(tagAround(render(), '立即填充')).not.toContain('disabled')
  })
})
