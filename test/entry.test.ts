import { describe, expect, it } from 'vitest'

import { capabilitiesFromModel, effortValues, effortsFromModel, isAgentModel } from '../src/core/entry.ts'
import type { CatalogModel } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/** One model record out of the fixture catalog. */
function model(provider: string, id: string): CatalogModel {
  const record = CATALOG[provider]?.models?.[id]
  if (record === undefined) throw new Error(`fixture ${provider}/${id} missing`)
  return record
}

describe('isAgentModel', () => {
  it('accepts a live tool-calling model', () => {
    expect(isAgentModel(model('openai', 'gpt-5.4'))).toBe(true)
  })

  it('rejects a non-tool model and a deprecated one', () => {
    expect(isAgentModel(model('openai', 'chatgpt-image-latest'))).toBe(false)
    expect(isAgentModel(model('openai', 'gpt-legacy'))).toBe(false)
  })
})

describe('effortValues', () => {
  it('reads effort values only, ignoring budget_tokens and toggle options', () => {
    expect(effortValues(model('anthropic', 'claude-opus-4-5'))).toEqual(['low', 'medium', 'high'])
    expect(effortValues(model('anthropic', 'claude-haiku-4-5'))).toEqual([])
    expect(effortValues(model('google', 'gemma-4-31b-it'))).toEqual([])
  })
})

describe('effortsFromModel', () => {
  it('maps the endpoint\'s own "none" onto the off level', () => {
    expect(effortsFromModel(model('openai', 'gpt-5.4'))).toEqual({
      off: 'none',
      low: 'low',
      medium: 'medium',
      high: 'high',
      xhigh: 'xhigh',
    })
  })

  it('declares false for a model that cannot think', () => {
    expect(effortsFromModel(model('openai', 'gpt-4o'))).toBe(false)
  })

  it('inherits instead of inventing levels when the catalog names none', () => {
    expect(effortsFromModel(model('anthropic', 'claude-haiku-4-5'))).toBeUndefined()
    expect(effortsFromModel(model('google', 'gemma-4-31b-it'))).toBeUndefined()
  })

  it('refuses to declare a map whose only level is off', () => {
    expect(effortsFromModel({ reasoning: true, reasoning_options: [{ type: 'effort', values: ['none'] }] })).toBe(false)
  })

  it('drops effort values the pi-ai schema does not accept', () => {
    expect(effortsFromModel({ reasoning: true, reasoning_options: [{ type: 'effort', values: ['default', 'high'] }] })).toEqual({
      high: 'high',
    })
  })
})

describe('capabilitiesFromModel', () => {
  it('maps limits, modalities and thinking levels', () => {
    expect(capabilitiesFromModel(model('openai', 'gpt-5.4'))).toEqual({
      name: 'GPT-5.4',
      contextWindow: 1050000,
      maxTokens: 128000,
      input: ['text', 'image'],
      reasoningEfforts: { off: 'none', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
    })
  })

  it('never writes the zero limits models.dev publishes for non-text endpoints', () => {
    const capabilities = capabilitiesFromModel({
      id: 'x',
      name: 'X',
      tool_call: true,
      modalities: { input: ['text'] },
      limit: { context: 0, output: 0 },
    })
    expect(capabilities).toEqual({ name: 'X', input: ['text'] })
  })

  it('reports text-only when the catalog names no image input', () => {
    expect(capabilitiesFromModel({ id: 'x', tool_call: true, modalities: { input: ['pdf'] } })?.input).toEqual(['text'])
  })

  it('says nothing about fields the catalog omits', () => {
    expect(capabilitiesFromModel({ id: 'x', tool_call: true })).toEqual({})
  })

  it('returns null for records that are not agent models', () => {
    expect(capabilitiesFromModel(model('openai', 'chatgpt-image-latest'))).toBeNull()
    expect(capabilitiesFromModel(model('openai', 'gpt-legacy'))).toBeNull()
    expect(capabilitiesFromModel(undefined)).toBeNull()
  })
})
