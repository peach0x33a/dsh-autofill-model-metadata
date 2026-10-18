/**
 * Contract test against the REAL llm-pi-ai schema.
 *
 * The plugin's whole output is a `providers.<route>.models` array, so the only
 * meaningful verification is the schema that will read it. This test imports the
 * published `@deepseek-ai/dsh-llm-pi-ai` (pinned to the version the target host
 * ships) and validates planned output through it.
 *
 * It skips itself when that package is not installed, so the suite still runs on
 * a machine that only builds the plugin.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planRoute } from '../src/core/plan.ts'
import { THINKING_LEVELS, type ReasoningEfforts } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/** Validate one value against a schemastery schema, returning it. */
type Validator = (value: unknown) => unknown

let validate: Validator | undefined
let version = 'unknown'
try {
  const mod = (await import('@deepseek-ai/dsh-llm-pi-ai')) as { Config?: Validator }
  validate = mod.Config
  const metadata = JSON.parse(
    readFileSync(resolve(process.cwd(), 'node_modules/@deepseek-ai/dsh-llm-pi-ai/package.json'), 'utf8'),
  ) as { version?: string }
  version = metadata.version ?? 'unknown'
} catch {
  validate = undefined
}

/** A route profile as the settings document carries it. */
function documentWith(models: unknown[]): unknown {
  return {
    providers: {
      'my-gateway': {
        api: 'openai-completions',
        baseURL: 'https://gateway.example.com/v1',
        models,
      },
    },
  }
}

/**
 * Validate a document and unwrap the providers layer.
 *
 * `providers` is a volatile field, so schemastery hands it back as a live
 * reference rather than a plain dict — the same shape the loader gives the
 * plugin, which is why `resolveConfig` reads through `get()`.
 */
function providersOf(document: unknown): Record<string, { models: Array<Record<string, unknown>> }> {
  const parsed = validate?.(document) as { providers: unknown }
  const providers =
    typeof (parsed.providers as { get?: unknown })?.get === 'function'
      ? (parsed.providers as { get: () => unknown }).get()
      : parsed.providers
  return providers as Record<string, { models: Array<Record<string, unknown>> }>
}

/** The serialized schema, in the shape `toJSON()` produces. */
interface SchemaJson {
  uid: number
  refs: Record<string, { meta?: { volatile?: boolean }; dict?: Record<string, number> }>
}

const describeContract = validate === undefined ? describe.skip : describe

describeContract(`llm-pi-ai schema contract (${version})`, () => {
  it('accepts the full planned output for a two-model route', () => {
    const plan = planRoute({
      route: 'my-gateway',
      models: [{ id: 'fast-model' }, { id: 'reasoner' }],
      mapping: { 'fast-model': 'google/gemini-flash-latest', reasoner: 'anthropic/claude-opus-4-5' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(true)

    const models = providersOf(documentWith(plan.entries))['my-gateway'].models
    expect(models).toHaveLength(2)
    // The local wire ids survive validation untouched.
    expect(models.map((entry) => entry.id)).toEqual(['fast-model', 'reasoner'])
    expect(models[0].contextWindow).toBe(1048576)
  })

  it('accepts every reasoningEfforts shape this plugin can emit', () => {
    const plan = planRoute({
      route: 'my-gateway',
      models: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      mapping: { a: 'openai/gpt-5.4', b: 'openai/gpt-4o', c: 'google/gemma-4-31b-it' },
      catalog: CATALOG,
    })
    expect(plan.ok).toBe(true)

    const models = providersOf(documentWith(plan.entries))['my-gateway'].models
    const byId = new Map(models.map((entry) => [entry.id, entry]))
    // effort map, non-reasoning, and "catalog is silent" (field left absent).
    expect(byId.get('a')?.reasoningEfforts).toMatchObject({ off: 'none' })
    expect(byId.get('b')?.reasoningEfforts).toBe(false)
    expect(byId.get('c')?.reasoningEfforts).toBeUndefined()
  })

  it('honours the schema rule that an efforts map needs a level beyond off', () => {
    const plan = planRoute({
      route: 'my-gateway',
      models: [{ id: 'a' }],
      mapping: { a: 'openai/gpt-5.4' },
      catalog: CATALOG,
    })
    const efforts = (plan.entries[0] as { reasoningEfforts?: ReasoningEfforts | false }).reasoningEfforts
    expect(efforts).not.toBe(false)
    if (efforts === undefined || efforts === false) throw new Error('expected an efforts map')
    const levels = Object.keys(efforts).filter((level) => THINKING_LEVELS.includes(level as never))
    expect(levels.some((level) => level !== 'off')).toBe(true)
  })

  it('has teeth: the schema rejects a zero context window and an unknown level', () => {
    // Proves the contract test would catch a regression, rather than passing vacuously.
    expect(() => validate?.(documentWith([{ id: 'x', contextWindow: 0 }]))).toThrow()
    expect(() => validate?.(documentWith([{ id: 'x', reasoningEfforts: { giant: 'giant' } }]))).toThrow()
  })

  it('exposes the profile shape the writer relies on: providers is the volatile field', () => {
    const json = (validate as unknown as { toJSON: () => SchemaJson }).toJSON()
    const root = Object.values(json.refs).find(
      (node) => node?.dict !== undefined && 'providers' in node.dict,
    )
    expect(root).toBeDefined()
    const providersRef = json.refs[String(root?.dict?.providers)]
    // The writer's path op is only accepted because this field is volatile.
    expect(providersRef?.meta?.volatile).toBe(true)
  })
})
