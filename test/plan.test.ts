import { describe, expect, it } from 'vitest'

import { mergeCapabilities, planRoute } from '../src/core/plan.ts'
import type { ModelEntry } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/** One route's declared models, as a settings entry list. */
function models(...ids: string[]): ModelEntry[] {
  return ids.map((id) => ({ id }))
}

describe('mergeCapabilities', () => {
  it('fills only what the entry leaves undefined', () => {
    const { entry, filledFields } = mergeCapabilities(
      { id: 'wire-id', contextWindow: 4096, name: 'Hand named' },
      { name: 'Catalog name', contextWindow: 200000, maxTokens: 64000, input: ['text', 'image'] },
    )
    expect(entry).toEqual({
      id: 'wire-id',
      contextWindow: 4096,
      name: 'Hand named',
      maxTokens: 64000,
      input: ['text', 'image'],
    })
    expect(filledFields).toEqual(['maxTokens', 'input'])
  })

  it('keeps unknown passthrough fields intact', () => {
    const { entry } = mergeCapabilities({ id: 'a', compat: { supportsDeveloperRole: false } }, { maxTokens: 10 })
    expect(entry.compat).toEqual({ supportsDeveloperRole: false })
  })

  it('reports no fill when the catalog has nothing to add', () => {
    expect(mergeCapabilities({ id: 'a', name: 'n', contextWindow: 1, maxTokens: 1, input: ['text'], reasoningEfforts: false }, {}).filledFields).toEqual([])
  })
})

describe('planRoute', () => {
  it('fills a fully mapped route and preserves declaration order', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('fast-model', 'reasoner'),
      mapping: { 'fast-model': 'google/gemini-flash-latest', reasoner: 'openai/gpt-5.4' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(true)
    expect(plan.errors).toEqual([])
    expect(plan.entries.map((entry) => entry.id)).toEqual(['fast-model', 'reasoner'])
    expect(plan.entries[0]).toMatchObject({
      id: 'fast-model',
      name: 'Gemini Flash Latest',
      contextWindow: 1048576,
      maxTokens: 65536,
      input: ['text', 'image'],
      reasoningEfforts: { low: 'low', medium: 'medium', high: 'high' },
    })
    // the local wire id is never replaced by the models.dev id
    expect(plan.entries[1].id).toBe('reasoner')
    expect(plan.applied).toEqual([
      { modelId: 'fast-model', source: 'google/gemini-flash-latest', filledFields: ['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts'] },
      { modelId: 'reasoner', source: 'openai/gpt-5.4', filledFields: ['name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts'] },
    ])
  })

  it('leaves hand-declared fields alone', () => {
    const plan = planRoute({
      route: 'gateway',
      models: [{ id: 'fast-model', name: 'My name', contextWindow: 32000 }],
      mapping: { 'fast-model': 'google/gemini-flash-latest' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(true)
    expect(plan.entries[0]).toMatchObject({ name: 'My name', contextWindow: 32000, maxTokens: 65536 })
  })

  it('refuses a route whose mapping is incomplete', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('mapped', 'orphan'),
      mapping: { mapped: 'openai/gpt-5.4' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(false)
    expect(plan.errors.map((error) => error.kind)).toEqual(['missing-mapping'])
    expect(plan.errors[0].modelId).toBe('orphan')
  })

  it('refuses a mapping that names an undeclared model, even without completeness', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('one'),
      mapping: { one: 'openai/gpt-5.4', typo: 'openai/gpt-5.4' },
      catalog: CATALOG,
      requireCompleteMapping: false,
    })
    expect(plan.ok).toBe(false)
    expect(plan.errors.map((error) => error.kind)).toEqual(['undeclared-mapping'])
  })

  it('touches only mapped models when completeness is off', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('mapped', 'untouched'),
      mapping: { mapped: 'openai/gpt-5.4' },
      catalog: CATALOG,
      requireCompleteMapping: false,
    })
    expect(plan.ok).toBe(true)
    expect(plan.entries[1]).toEqual({ id: 'untouched' })
  })

  it('refuses the whole route when one source does not resolve', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('good', 'bad'),
      mapping: { good: 'openai/gpt-5.4', bad: 'openai/gpt-9' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(false)
    expect(plan.applied).toEqual([])
    expect(plan.entries).toEqual(models('good', 'bad'))
    expect(plan.errors.map((error) => error.kind)).toEqual(['unknown-model'])
    expect(plan.errors[0].modelId).toBe('bad')
  })

  it('refuses a source that points at a non-chat record', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('image'),
      mapping: { image: 'openai/chatgpt-image-latest' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(false)
    expect(plan.errors.map((error) => error.kind)).toEqual(['not-agent-capable'])
  })

  it('collects every refusal rather than stopping at the first', () => {
    const plan = planRoute({
      route: 'gateway',
      models: models('a', 'b', 'c'),
      mapping: { a: 'openai/gpt-9', b: 'nope/gpt-5.4', c: 'openai/gpt-5.4' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(false)
    expect(plan.errors.map((error) => error.kind).sort()).toEqual(['unknown-model', 'unknown-provider'])
  })
})
