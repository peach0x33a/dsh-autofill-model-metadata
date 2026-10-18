import { describe, expect, it } from 'vitest'

import { parseSource, resolveSource } from '../src/core/source.ts'
import { CATALOG } from './fixtures.ts'

describe('parseSource', () => {
  it('splits at the first slash so model ids may contain slashes', () => {
    expect(parseSource('workers-ai/@cf/meta/llama-3')).toEqual({
      providerId: 'workers-ai',
      modelId: '@cf/meta/llama-3',
    })
  })

  it('rejects strings that are not a provider/model path', () => {
    for (const bad of ['', 'gpt-5', '/gpt-5', 'openai/', 'openai//', null, 42, undefined]) {
      expect(parseSource(bad)).toBeNull()
    }
  })
})

describe('resolveSource', () => {
  it('resolves an exact id inside the named provider only', () => {
    const result = resolveSource(CATALOG, 'openai/gpt-5.4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.ref).toEqual({
      source: 'openai/gpt-5.4',
      providerId: 'openai',
      requestedModelId: 'gpt-5.4',
      resolvedModelId: 'gpt-5.4',
    })
    expect(result.model.name).toBe('GPT-5.4')
  })

  it('does not search another provider for the same model name', () => {
    // gpt-5.4 exists in openai but is asked for under google.
    const result = resolveSource(CATALOG, 'google/gpt-5.4')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown-model')
    expect(result.error.message).toContain('google')
  })

  it('accepts a unique case-insensitive match and reports the resolved spelling', () => {
    const result = resolveSource(CATALOG, 'openai/GPT-5.4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.ref.resolvedModelId).toBe('gpt-5.4')
  })

  it('refuses an ambiguous case-insensitive match instead of picking one', () => {
    const result = resolveSource(CATALOG, 'google/GEMINI-FLASH-LATEST')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('ambiguous-source')
    expect(result.error.message).toContain('gemini-flash-latest')
    expect(result.error.message).toContain('Gemini-Flash-Latest')
  })

  it('names an unknown provider', () => {
    const result = resolveSource(CATALOG, 'nope/gpt-5.4')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown-provider')
  })

  it('names a malformed source', () => {
    const result = resolveSource(CATALOG, 'gpt-5.4')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('malformed-source')
  })

  it('refuses anything when there is no catalog at all', () => {
    const result = resolveSource(undefined, 'openai/gpt-5.4')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown-provider')
  })
})
