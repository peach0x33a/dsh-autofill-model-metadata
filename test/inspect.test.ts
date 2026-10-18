import { describe, expect, it, vi } from 'vitest'

import { reportRoutes, searchCatalog } from '../src/core/inspect.ts'
import type { ProviderRow, SettingsOp, SettingsSeam, SettingsView } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/** A settings seam over one namespace view. */
function seam(view: SettingsView): SettingsSeam {
  return { describe: () => [view], mutate: vi.fn(async (_ns: string, _ops: SettingsOp[], _revision: number) => undefined) }
}

/** A provider directory row for one route. */
function row(route: string): ProviderRow {
  return { provider: route, displayName: route, settingsNs: 'llm-pi-ai', settingsPath: ['providers', route] }
}

/** A namespace view holding one configured route. */
function viewWith(models: unknown[]): SettingsView {
  return {
    ns: 'llm-pi-ai',
    revision: 4,
    value: { providers: { gw: { api: 'openai-completions', models } } },
  }
}

const MAPPING = { gw: { a: 'openai/gpt-5.4', b: 'google/gemini-flash-latest' } }

describe('reportRoutes', () => {
  it('reports each model with its state, the fields it declares and what would be filled', () => {
    const reports = reportRoutes({
      settings: seam(viewWith([{ id: 'a', name: 'Hand-written' }, { id: 'b' }, { id: 'c' }])),
      providers: [row('gw')],
      mapping: MAPPING,
      catalog: CATALOG,
    })

    expect(reports).toHaveLength(1)
    const [report] = reports
    expect(report.resolved).toBe(true)
    expect(report.configured).toBe(true)
    expect(report.mapped).toBe(true)
    expect(report.counts).toEqual({ models: 3, mapped: 0, filled: 2, unchanged: 0, unmapped: 1, invalid: 0 })

    const [a, b, c] = report.models
    // `a` declares its name, so the catalog fills every other field.
    expect(a.declared).toEqual(['name'])
    expect(a.state).toBe('filled')
    expect(Object.keys(a.filled)).toEqual(['contextWindow', 'maxTokens', 'input', 'reasoningEfforts'])
    // `b` declares nothing, so the catalog fills all five.
    expect(b.declared).toEqual([])
    expect(b.state).toBe('filled')
    expect(Object.keys(b.filled)).toEqual(['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts'])
    // `c` has no mapping entry at all.
    expect(c.state).toBe('unmapped')
    expect(c.source).toBeUndefined()
  })

  it('calls a mapped model unchanged when the profile already declares every field', () => {
    const complete = {
      id: 'a',
      name: 'n',
      contextWindow: 1,
      maxTokens: 1,
      input: ['text'],
      reasoningEfforts: false,
    }
    const [report] = reportRoutes({
      settings: seam(viewWith([complete])),
      providers: [row('gw')],
      mapping: { gw: { a: 'openai/gpt-5.4' } },
      catalog: CATALOG,
    })
    expect(report.models[0].state).toBe('unchanged')
    expect(report.models[0].filled).toEqual({})
    expect(report.counts).toEqual({ models: 1, mapped: 0, filled: 0, unchanged: 1, unmapped: 0, invalid: 0 })
  })

  it('refuses a route whose mapping is incomplete, and names both the gap and the typo', () => {
    const [report] = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }, { id: 'c' }])),
      providers: [row('gw')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(report.errors.map((error) => [error.kind, error.modelId])).toEqual([
      ['missing-mapping', 'c'],
      ['undeclared-mapping', 'b'],
    ])
  })

  it('flags a mapping key the route does not declare, even with completeness off', () => {
    const [report] = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [row('gw')],
      mapping: { gw: { a: 'openai/gpt-5.4', typo: 'openai/gpt-4o' } },
      catalog: CATALOG,
      requireCompleteMapping: false,
    })
    expect(report.orphans).toEqual(['typo'])
    expect(report.errors[0].kind).toBe('undeclared-mapping')
  })

  it('marks a source that resolves to a non-agent record invalid instead of failing the whole report', () => {
    const [report] = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }, { id: 'b' }])),
      providers: [row('gw')],
      mapping: { gw: { a: 'anthropic/text-embedding-3', b: 'openai/gpt-legacy' } },
      catalog: CATALOG,
    })
    expect(report.models.map((model) => model.state)).toEqual(['invalid', 'invalid'])
    expect(report.errors.map((error) => error.kind)).toEqual(['not-agent-capable', 'not-agent-capable'])
    expect(report.counts.invalid).toBe(2)
  })

  it('works without a catalog: mapping presence only, and no resolution claim', () => {
    const [report] = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }, { id: 'b' }, { id: 'c' }])),
      providers: [row('gw')],
      mapping: MAPPING,
    })
    expect(report.resolved).toBe(false)
    expect(report.models.map((model) => model.state)).toEqual(['mapped', 'mapped', 'unmapped'])
    expect(report.errors).toEqual([])
    expect(report.counts).toEqual({ models: 3, mapped: 2, filled: 0, unchanged: 0, unmapped: 1, invalid: 0 })
  })

  it('reports an unconfigured route with a reason instead of dropping it', () => {
    const [report] = reportRoutes({
      settings: seam({ ns: 'llm-pi-ai', revision: 1, value: { providers: {} } }),
      providers: [row('gw')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(report.configured).toBe(false)
    expect(report.reason).toContain('not configured')
    expect(report.models).toEqual([])
  })

  it('reports a mapped route the host does not offer, so a typo is visible', () => {
    const reports = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [],
      mapping: { ghost: { a: 'openai/gpt-5.4' } },
      catalog: CATALOG,
    })
    expect(reports).toHaveLength(1)
    expect(reports[0].route).toBe('ghost')
    expect(reports[0].reason).toContain('not a configurable provider')
  })

  it('reports an unregistered namespace', () => {
    const settings: SettingsSeam = { describe: () => [], mutate: vi.fn() }
    const [report] = reportRoutes({ settings, providers: [row('gw')], mapping: MAPPING, catalog: CATALOG })
    expect(report.reason).toContain('not registered')
  })

  it('reads the user layer first, since that is what a write would be based on', () => {
    const [report] = reportRoutes({
      settings: seam({
        ns: 'llm-pi-ai',
        revision: 2,
        value: { providers: { gw: { models: [{ id: 'a' }] } } },
        user: { providers: { gw: { models: [{ id: 'a' }, { id: 'b' }] } } },
      }),
      providers: [row('gw')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(report.models.map((model) => model.id)).toEqual(['a', 'b'])
  })

  it('skips routes nobody configured and nobody mapped', () => {
    // A stock install advertises dozens of providers; listing the ones the
    // profile never configured buried the real routes under empty cards.
    const reports = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [
        row('anthropic'),
        row('google'),
        { provider: 'openai', displayName: 'openai', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'openai'] },
        row('gw'),
      ],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(reports.map((report) => report.route)).toEqual(['gw'])
    // …while a configured route with nothing mapped is still shown.
    const idle = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [row('gw')],
      mapping: {},
      catalog: CATALOG,
    })
    expect(idle.map((report) => report.route)).toEqual(['gw'])
  })

  it('adds a mapped route the host does not offer, next to the configured ones', () => {
    const reports = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [row('anthropic'), row('gw')],
      // `gw` is configured, so it is reported; `ghost` is only mapped, and a typo
      // must never be able to hide just because the host does not know the route.
      mapping: { ghost: { a: 'openai/gpt-5.4' } },
      catalog: CATALOG,
    })
    expect(reports.map((report) => report.route)).toEqual(['gw', 'ghost'])
    expect(reports[1].reason).toContain('not a configurable provider')
  })

  it('ignores provider rows belonging to another namespace', () => {
    const reports = reportRoutes({
      settings: seam(viewWith([{ id: 'a' }])),
      providers: [{ provider: 'elsewhere', settingsNs: 'other-plugin', settingsPath: ['providers', 'elsewhere'] }],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(reports.map((report) => report.route)).toEqual(['gw'])
  })
})

describe('searchCatalog', () => {
  it('ranks an exact source first, then usable records', () => {
    const hits = searchCatalog(CATALOG, 'gemini-flash-latest', 10)
    expect(hits[0].source).toBe('google/gemini-flash-latest')
    expect(hits[0].usable).toBe(true)
    expect(hits[0].contextWindow).toBe(1048576)
    expect(hits[0].maxTokens).toBe(65536)
    expect(hits[0].effortLevels).toEqual(['low', 'medium', 'high'])
  })

  it('finds a record by its display name and by `provider/model`', () => {
    expect(searchCatalog(CATALOG, 'claude opus', 5).map((hit) => hit.source)).toContain('anthropic/claude-opus-4-5')
    expect(searchCatalog(CATALOG, 'anthropic/claude-haiku-4-5', 5)[0].source).toBe('anthropic/claude-haiku-4-5')
  })

  it('ranks a usable record above an unusable one of the same rank', () => {
    const hits = searchCatalog(CATALOG, 'embedding', 5)
    expect(hits[0].source).toBe('anthropic/text-embedding-3')
    expect(hits[0].usable).toBe(false)
    expect(hits[0].problem).toContain('tool_call=false')
  })

  it('marks a deprecated record unusable but still offers it', () => {
    const hits = searchCatalog(CATALOG, 'gpt-legacy', 5)
    expect(hits[0].usable).toBe(false)
    expect(hits[0].problem).toContain('deprecated')
  })

  it('never writes a zero limit into a candidate', () => {
    const hits = searchCatalog(CATALOG, 'chatgpt-image-latest', 3)
    expect(hits[0].contextWindow).toBeUndefined()
    expect(hits[0].maxTokens).toBeUndefined()
    expect(hits[0].usable).toBe(false)
  })

  it('honours the limit, and answers nothing without a catalog', () => {
    expect(searchCatalog(CATALOG, '', 3)).toHaveLength(3)
    expect(searchCatalog(undefined, 'gpt', 3)).toEqual([])
    expect(searchCatalog(CATALOG, 'no-such-model-anywhere', 5)).toEqual([])
  })
})
