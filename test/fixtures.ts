/**
 * Fixtures mirroring the shapes models.dev actually publishes (verified against
 * https://models.dev/api.json), so the tests exercise real data rather than
 * invented records.
 */
import type { Catalog } from '../src/core/types.ts'

/** One live-shaped catalog: an agent model, a non-agent model, a toggle-only model. */
export const CATALOG: Catalog = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    npm: '@ai-sdk/anthropic',
    models: {
      'claude-opus-4-5': {
        id: 'claude-opus-4-5',
        name: 'Claude Opus 4.5 (latest)',
        reasoning: true,
        reasoning_options: [
          { type: 'effort', values: ['low', 'medium', 'high'] },
          { type: 'budget_tokens', min: 1024 },
        ],
        tool_call: true,
        modalities: { input: ['text', 'image', 'pdf'], output: ['text'] },
        limit: { context: 200000, output: 64000 },
      },
      'claude-haiku-4-5': {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        reasoning: true,
        // budget_tokens only: no discrete levels, so the plugin must inherit.
        reasoning_options: [{ type: 'budget_tokens', min: 1024 }],
        tool_call: true,
        modalities: { input: ['text', 'image', 'pdf'], output: ['text'] },
        limit: { context: 200000, output: 64000 },
      },
      'text-embedding-3': {
        id: 'text-embedding-3',
        name: 'Embedding',
        tool_call: false,
        modalities: { input: ['text'], output: ['text'] },
        limit: { context: 8191, output: 0 },
      },
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    npm: '@ai-sdk/openai',
    models: {
      'gpt-5.4': {
        id: 'gpt-5.4',
        name: 'GPT-5.4',
        reasoning: true,
        reasoning_options: [{ type: 'effort', values: ['none', 'low', 'medium', 'high', 'xhigh'] }],
        tool_call: true,
        modalities: { input: ['text', 'image', 'pdf'], output: ['text'] },
        limit: { context: 1050000, output: 128000 },
      },
      'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        reasoning: false,
        tool_call: true,
        modalities: { input: ['text', 'image'], output: ['text'] },
        limit: { context: 128000, output: 16384 },
      },
      // models.dev publishes limit 0 for image endpoints; a 0 must never be written.
      'chatgpt-image-latest': {
        id: 'chatgpt-image-latest',
        name: 'chatgpt-image-latest',
        reasoning: false,
        tool_call: false,
        modalities: { input: ['text', 'image'], output: ['text', 'image'] },
        limit: { context: 0, input: 0, output: 0 },
      },
      'gpt-legacy': {
        id: 'gpt-legacy',
        name: 'GPT Legacy',
        tool_call: true,
        status: 'deprecated',
        modalities: { input: ['text'], output: ['text'] },
        limit: { context: 128000, output: 4096 },
      },
    },
  },
  google: {
    id: 'google',
    name: 'Google',
    npm: '@ai-sdk/google',
    models: {
      'gemini-flash-latest': {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        reasoning: true,
        reasoning_options: [{ type: 'effort', values: ['low', 'medium', 'high'] }],
        tool_call: true,
        modalities: { input: ['text', 'image', 'video', 'audio', 'pdf'], output: ['text'] },
        limit: { context: 1048576, output: 65536 },
      },
      // toggle-only reasoning: no discrete levels, so the plugin must inherit.
      'gemma-4-31b-it': {
        id: 'gemma-4-31b-it',
        name: 'Gemma 4 31B IT',
        reasoning: true,
        reasoning_options: [{ type: 'toggle' }],
        tool_call: true,
        modalities: { input: ['text', 'image'], output: ['text'] },
        limit: { context: 262144, output: 32768 },
      },
      // Case-collision pair: resolving "GEMINI-FLASH-LATEST" must fail, not guess.
      'Gemini-Flash-Latest': {
        id: 'Gemini-Flash-Latest',
        name: 'Gemini Flash Latest (legacy casing)',
        tool_call: true,
        modalities: { input: ['text'], output: ['text'] },
        limit: { context: 1000000, output: 65536 },
      },
    },
  },
}
