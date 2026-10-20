import { describe, expect, it } from 'vitest'

import { COPY_NS, en, fallbackFor, interpolate, makeT, zh } from '../src/client/copy.ts'
import { platformTranslator } from './stubs/locale.ts'
import {
  adoptDraft,
  candidateDetail,
  cardsFor,
  coverageOf,
  describeCandidate,
  describeFilled,
  describeFilledFields,
  formatFetchedAt,
  formatTokens,
  rowKey,
  sameMapping,
  outcomeOf,
  stateKey,
  stateTone,
  summarizePass,
  summaryParts,
  summaryTone,
  withSource,
  type Mapping,
} from '../src/client/model.ts'
import type { Candidate, ReportedRoute } from '../src/client/api.ts'

/** One host report with a filled, an unmapped and an invalid model. */
const REPORT: ReportedRoute = {
  route: 'my-gateway',
  displayName: 'gzz',
  settingsNs: 'llm-pi-ai',
  configured: true,
  mapped: true,
  resolved: true,
  orphans: ['typo-key'],
  errors: [{ kind: 'undeclared-mapping', message: 'typo-key is not declared', modelId: 'typo-key' }],
  counts: { models: 3, mapped: 0, filled: 1, unchanged: 0, unmapped: 1, invalid: 1 },
  models: [
    {
      id: 'gemini-3.8-flash',
      declared: ['name'],
      source: 'google/gemini-3.8-flash',
      state: 'filled',
      filled: { contextWindow: 1048576, maxTokens: 65536, input: ['text', 'image'] },
    },
    { id: 'step-3.7-flash', declared: [], state: 'unmapped', filled: {} },
    {
      id: 'broken',
      declared: [],
      source: 'acme/not-an-agent',
      state: 'invalid',
      filled: {},
      error: { kind: 'not-agent-capable', message: 'tool_call=false' },
    },
  ],
}

/**
 * The mapping the host holds in these tests.
 *
 * It has to agree with {@link REPORT}: the report's per-model sources are
 * derived from exactly this table, so a fixture where they disagree would be
 * testing a state the host cannot produce.
 */
const SAVED: Mapping = {
  'my-gateway': {
    'gemini-3.8-flash': 'google/gemini-3.8-flash',
    broken: 'acme/not-an-agent',
    // `REPORT` calls this undeclared, so the table the host holds must carry it.
    'typo-key': 'openai/gpt-4o',
  },
}

/** A candidate as the search endpoint answers it. */
const CANDIDATE: Candidate = {
  source: 'openai/gpt-5.4',
  provider: 'openai',
  providerName: 'OpenAI',
  model: 'gpt-5.4',
  name: 'GPT-5.4',
  contextWindow: 1050000,
  maxTokens: 128000,
  toolCall: true,
  usable: true,
  effortLevels: ['low', 'medium', 'high'],
}

describe('mapping edits', () => {
  it('sets one entry without touching the rest of the table', () => {
    const before: Mapping = { a: { m1: 'x/y' }, b: { m2: 'z/w' } }
    const after = withSource(before, 'a', 'm3', 'q/r')
    expect(after).toEqual({ a: { m1: 'x/y', m3: 'q/r' }, b: { m2: 'z/w' } })
    expect(before).toEqual({ a: { m1: 'x/y' }, b: { m2: 'z/w' } })
  })

  it('trims whitespace, and clearing removes the entry and an emptied route', () => {
    expect(withSource({}, 'a', 'm1', '  q/r  ')).toEqual({ a: { m1: 'q/r' } })
    expect(withSource({ a: { m1: 'q/r' } }, 'a', 'm1', '')).toEqual({})
    expect(withSource({ a: { m1: 'q/r', m2: 's/t' } }, 'a', 'm1', '  ')).toEqual({ a: { m2: 's/t' } })
  })

  it('compares tables by content, not by key order', () => {
    expect(sameMapping({ a: { m: 'x/y' } }, { a: { m: 'x/y' } })).toBe(true)
    expect(sameMapping({ a: { m: 'x/y' }, b: {} }, { a: { m: 'x/y' } })).toBe(true)
    expect(sameMapping({ a: { m: 'x/y' } }, { a: { m: 'x/z' } })).toBe(false)
    expect(sameMapping({}, { a: { m: 'x/y' } })).toBe(false)
  })

  it('gives every row a stable key', () => {
    expect(rowKey('a', 'b')).toBe(rowKey('a', 'b'))
    expect(rowKey('a', 'b')).not.toBe(rowKey('ab', ''))
  })
})

describe('cardsFor', () => {
  it('shows the draft, and marks rows that differ from the host', () => {
    const draft = withSource(SAVED, 'my-gateway', 'step-3.7-flash', 'stepfun/step-3.7-flash')
    const [card] = cardsFor([REPORT], draft, SAVED)

    expect(card.displayName).toBe('gzz')
    expect(card.rows.map((row) => [row.modelId, row.source, row.edited])).toEqual([
      ['gemini-3.8-flash', 'google/gemini-3.8-flash', false],
      ['step-3.7-flash', 'stepfun/step-3.7-flash', true],
      ['broken', 'acme/not-an-agent', false],
    ])
  })

  it('does not resurrect a value the operator just cleared', () => {
    const [card] = cardsFor([REPORT], {}, SAVED)
    expect(card.rows[0]).toMatchObject({ modelId: 'gemini-3.8-flash', source: undefined, edited: true })
  })
})

describe('adoptDraft', () => {
  it('takes the host table when there is no local edit to lose', () => {
    const incoming: Mapping = { a: { m: 'x/y' } }
    expect(adoptDraft(SAVED, SAVED, incoming)).toEqual(incoming)
  })

  it('keeps unsaved edits through a reload', () => {
    // The bug this pins: "Check against catalog" used to overwrite the draft with
    // the host's table, throwing away the mapping the operator had just typed.
    const draft = withSource(SAVED, 'my-gateway', 'step-3.7-flash', 'stepfun/step-3.7-flash')
    expect(adoptDraft(draft, SAVED, {})).toEqual(draft)
  })

  it('keeps a cleared entry cleared', () => {
    // A deletion differs from the saved table by absence, which `sameMapping`
    // must see — otherwise the value would come back on the next reload.
    const cleared = withSource(SAVED, 'my-gateway', 'typo-key', '')
    expect(adoptDraft(cleared, SAVED, SAVED)).toEqual(cleared)
  })
})

describe('refusals follow the draft, not the last apply', () => {
  it('keeps a refusal while the value it describes is untouched', () => {
    // The report says `typo-key` is undeclared and `SAVED` still carries it, so
    // the refusal applies to exactly what the page would send.
    const [card] = cardsFor([REPORT], SAVED, SAVED)
    expect(card.orphans).toEqual(['typo-key'])
    expect(card.errors.map((error) => error.kind)).toEqual(['undeclared-mapping'])
    expect(card.writable).toBe(false)
  })

  it('drops the orphan and its refusal the moment the extra key leaves the draft', () => {
    // The bug this pins: these came from the host report, so removing the key in
    // the page left the route "blocked" and Save-and-fill disabled until the
    // operator saved and re-inspected.
    const draft = withSource(withSource(SAVED, 'my-gateway', 'typo-key', ''), 'my-gateway', 'step-3.7-flash', 'stepfun/step-3.7-flash')
    const [card] = cardsFor([REPORT], draft, SAVED)

    expect(card.orphans).toEqual([])
    expect(card.errors).toEqual([])
    expect(card.writable).toBe(true)
    // One edited row (`step-3.7-flash`); removing `typo-key` drops a key rather
    // than editing a reported row, so it is not counted here.
    expect(coverageOf([card])).toEqual({ models: 3, mapped: 3, unmapped: 0, edited: 1, blockedRoutes: 0 })
  })

  it('still blocks a route whose model would be refused, even when the mapping is complete', () => {
    // `broken` resolves to a catalog record that cannot call tools: a complete
    // mapping is not the same thing as an applicable one, and the page must not
    // offer to fill a route the host will refuse.
    const draft = withSource(withSource(SAVED, 'my-gateway', 'typo-key', ''), 'my-gateway', 'step-3.7-flash', 'stepfun/step-3.7-flash')
    const [card] = cardsFor([REPORT], draft, SAVED)
    expect(card.rows.find((row) => row.modelId === 'broken')?.error?.kind).toBe('not-agent-capable')
  })
})

describe('summarizePass', () => {
  it('reads the host outcome lines back', () => {
    expect(outcomeOf('my-gateway: applied (a: name, contextWindow)')).toBe('applied')
    expect(outcomeOf('my-gateway: would apply (a: name)')).toBe('dry-run')
    expect(outcomeOf('my-gateway: already complete')).toBe('unchanged')
    expect(outcomeOf('my-gateway: refused — missing-mapping: b')).toBe('refused')
  })

  it('never calls a pass a fill when it wrote nothing', () => {
    // The bug this pins: a dry run (and an already-complete route) was reported
    // to the operator as "saved and applied".
    expect(summarizePass(['gw: would apply (a: name)'])).toEqual({ kind: 'dry-run' })
    expect(summarizePass(['gw: already complete'])).toEqual({ kind: 'unchanged' })
    expect(summarizePass([])).toEqual({ kind: 'empty' })
    expect(summarizePass(['gw: applied (a: name)'])).toEqual({ kind: 'applied' })
  })

  it('reports the first refused route, and refusal outranks a partial fill', () => {
    expect(summarizePass(['a: applied (x: name)', 'b: refused — unknown-model: y'])).toEqual({
      kind: 'refused',
      route: 'b',
    })
  })
})

describe('coverage', () => {
  it('counts the draft, and calls a gap a route a pass would refuse', () => {
    const [card] = cardsFor([REPORT], SAVED, SAVED)
    expect(coverageOf([card])).toEqual({ models: 3, mapped: 2, unmapped: 1, edited: 0, blockedRoutes: 1 })
  })

  it('does not block a gap the host would accept', () => {
    // `requireCompleteMapping: false` means the host fills what it can and leaves
    // the rest; disabling the button for that gap would withhold a legal action.
    // No orphan here, so the gap is the only thing that could block.
    const clean: ReportedRoute = { ...REPORT, orphans: [], errors: [] }
    const draft = { 'my-gateway': { 'gemini-3.8-flash': 'google/gemini-3.8-flash' } }
    const [card] = cardsFor([clean], draft, draft)
    expect(card.orphans).toEqual([])
    expect(coverageOf([card], true).blockedRoutes).toBe(1)
    expect(coverageOf([card], false).blockedRoutes).toBe(0)
    expect(coverageOf([card], false).unmapped).toBe(2)
  })

  it('still blocks an orphan when completeness is off', () => {
    // A mapping key the route does not declare is refused either way.
    const [card] = cardsFor([REPORT], SAVED, SAVED)
    expect(card.orphans).toEqual(['typo-key'])
    expect(coverageOf([card], false).blockedRoutes).toBe(1)
  })

  it('names the copy key and tone for every state', () => {
    expect(['filled', 'unchanged', 'mapped', 'unmapped', 'invalid'].map((state) => stateKey(state as never))).toEqual([
      'stateFilled',
      'stateUnchanged',
      'stateMapped',
      'stateUnmapped',
      'stateInvalid',
    ])
    expect(stateTone('unchanged')).toBe('ok')
    expect(stateTone('invalid')).toBe('bad')
    expect(stateTone('unmapped')).toBe('warn')
  })

  it('formats token budgets the way the page shows them', () => {
    expect(formatTokens(1050000)).toBe('1M')
    expect(formatTokens(65536)).toBe('66K')
    expect(formatTokens(512)).toBe('512')
    // A missing or zero limit must read as absent, never as "0".
    expect(formatTokens(0)).toBeUndefined()
    expect(formatTokens(undefined)).toBeUndefined()
    expect(formatTokens('1048576')).toBeUndefined()
  })

  it('describes a candidate with its budget and levels', () => {
    expect(describeCandidate(CANDIDATE)).toBe('openai/gpt-5.4 · GPT-5.4 · ctx 1M · out 128K · low/medium/high')
    expect(candidateDetail(CANDIDATE)).toBe('GPT-5.4 · ctx 1M · out 128K · low/medium/high')
    expect(describeCandidate({ ...CANDIDATE, usable: false, problem: 'tool_call=false' })).toContain('✗ tool_call=false')
    expect(describeCandidate({ source: 'a/b', provider: 'a', model: 'b', toolCall: false, usable: false })).toBe('a/b')
  })

  it('splits filled fields into label and value for the chips', () => {
    expect(describeFilledFields({ contextWindow: 65536, name: 'GPT-5.4' })).toEqual([
      { field: 'contextWindow', value: '66K' },
      { field: 'name', value: 'GPT-5.4' },
    ])
  })

  it('gives each route summary the tone its state means', () => {
    expect(summaryTone('summaryUnchanged')).toBe('ok')
    expect(summaryTone('summaryMapped')).toBe('info')
    expect(summaryTone('summaryUnmapped')).toBe('warn')
    expect(summaryTone('summaryInvalid')).toBe('bad')
    expect(summaryTone('summaryFilled')).toBe('info')
    expect(summaryTone('summaryModels')).toBe('neutral')
  })

  it('renders filled fields compactly, including inherited levels', () => {
    expect(describeFilled({ contextWindow: 200000, input: ['text', 'image'] })).toEqual([
      'contextWindow: 200K',
      'input: text+image',
    ])
    expect(describeFilled({ reasoningEfforts: { low: 'low', high: null } })).toEqual([
      'reasoningEfforts: low→low high→inherit',
    ])
  })

  it('formats a fetch time, and refuses nonsense', () => {
    expect(typeof formatFetchedAt(0)).toBe('string')
    expect(formatFetchedAt(Number.NaN)).toBeUndefined()
    expect(formatFetchedAt(undefined)).toBeUndefined()
  })
})

describe('copy through the host locale service', () => {
  it('keeps every dictionary entry a plain string', () => {
    // `LocaleFace.translate` calls `template.replace` on the resolved entry, so a
    // non-string value throws during render and the slot boundary blanks the
    // page. This assertion is the guard against that class of bug.
    for (const [locale, dictionary] of Object.entries({ en, zh })) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(typeof value, `${locale}.${key} must be a string`).toBe('string')
      }
    }
  })

  it('reads every entry through the host translator without throwing', () => {
    const bound = platformTranslator({ [COPY_NS]: zh })
    const t = makeT(bound(COPY_NS))
    const params = { count: 226, when: '2026/1/1', reason: 'ENOTFOUND', mapped: 2, models: 3, unmapped: 1, routes: 1 }
    for (const key of Object.keys(zh) as Array<keyof typeof zh>) {
      const rendered = t(key, params)
      expect(typeof rendered, key).toBe('string')
      // Nothing may come back unresolved: `{x}` only survives when unpassed.
      expect(rendered.startsWith('{'), key).toBe(false)
    }
  })

  it('substitutes the same placeholders the platform would', () => {
    const bound = platformTranslator({ [COPY_NS]: zh })
    const t = makeT(bound(COPY_NS))
    expect(t('coverage', { mapped: 2, models: 3, unmapped: 1 })).toBe('2/3 个模型已映射')
    expect(t('blocked', { routes: 1 })).toBe('有 1 条路由还有模型未映射，补齐后才能保存并填充。')
    expect(t('catalogUnavailable', { reason: 'ENOTFOUND' })).toBe('无法读取目录：ENOTFOUND')
    expect(t('failed', { reason: 'boom' })).toBe('失败：boom')
  })

  it('leaves a placeholder alone rather than blanking it', () => {
    expect(interpolate('a {x} b', { y: 1 })).toBe('a {x} b')
    expect(interpolate('a {x} b', { x: 0 })).toBe('a 0 b')
    expect(interpolate('plain')).toBe('plain')
  })

  it('translates through a bound translator when it knows the namespace', () => {
    const t = makeT((key: string) => (key === 'nav' ? 'Model metadata' : key))
    expect(t('nav')).toBe('Model metadata')
  })

  it('falls back to the built-in dictionary when a key is echoed back', () => {
    const t = makeT((key: string) => key)
    expect(t('nav')).toBe(zh.nav)
    expect(t('coverage', { mapped: 2, models: 3, unmapped: 1 })).toBe(zh.coverage.replace('{mapped}', '2').replace('{models}', '3').replace('{unmapped}', '1'))
  })

  it('backs the fallback with the dictionary the active locale asks for', () => {
    // A Chinese default here would show Chinese badges on an English deployment.
    expect(fallbackFor('en')).toBe(en)
    expect(fallbackFor('en-US')).toBe(en)
    expect(fallbackFor('zh')).toBe(zh)
    expect(fallbackFor('zh-CN')).toBe(zh)
    expect(fallbackFor(undefined)).toBe(zh)
    const english = makeT(undefined, fallbackFor('en'))
    expect(english('nav')).toBe(en.nav)
    expect(english('stateFilled')).toBe(en.stateFilled)
  })

  it('falls back when no translator is bound at all', () => {
    const t = makeT(undefined)
    expect(t('title')).toBe(zh.title)
    expect(t('catalogProviders', { count: 226 })).toBe('226 个提供商')
  })

  it('falls back when the bound translator throws', () => {
    const t = makeT(() => {
      throw new Error('no locale')
    })
    expect(t('save')).toBe(zh.save)
  })
})
