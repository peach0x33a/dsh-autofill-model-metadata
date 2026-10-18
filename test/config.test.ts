import { describe, expect, it } from 'vitest'

import { Config, resolveConfig } from '../src/index.ts'

/**
 * schemastery's `toJSON()` serializes a schema as `{ uid, refs }`, where every
 * field of an object lives in `dict` as a ref id. That is exactly the shape the
 * host reads when it decides which config fields it may write back, so the
 * volatility assertion walks it the same way.
 */
interface SchemaJson {
  uid: number
  refs: Record<string, { meta?: { volatile?: boolean }; dict?: Record<string, number> }>
}

/** The object node carrying `field`, and the node each of its fields references. */
function rootFields(json: SchemaJson): Record<string, { meta?: { volatile?: boolean } }> {
  const root = Object.values(json.refs).find((node) => node?.dict !== undefined && 'mapping' in node.dict)
  expect(root).toBeDefined()
  return Object.fromEntries(
    Object.entries(root?.dict ?? {}).map(([field, ref]) => [field, json.refs[String(ref)] ?? {}]),
  )
}

describe('Config schema', () => {
  it('defaults to an inert, non-destructive configuration', () => {
    const resolved = resolveConfig({})
    expect(resolved.modelsDevUrl).toBe('https://models.dev/api.json')
    expect(resolved.cacheTTLHours).toBe(24)
    expect(resolved.applyOnStart).toBe(true)
    expect(resolved.dryRun).toBe(false)
    expect(resolved.requireCompleteMapping).toBe(true)
    expect(resolved.mapping).toEqual({})
    expect(resolved.cachePath).toContain('models.dev.json')
    // The safer half of the settings policy: stock settings are assumed to work
    // until the browser half proves otherwise.
    expect(resolved.builtinSettingsForm).toBe('auto')
  })

  it('reads the settings-form policy, accepting the booleans it used to take', () => {
    expect(resolveConfig({ builtinSettingsForm: 'auto' }).builtinSettingsForm).toBe('auto')
    expect(resolveConfig({ builtinSettingsForm: 'always' }).builtinSettingsForm).toBe('always')
    expect(resolveConfig({ builtinSettingsForm: 'never' }).builtinSettingsForm).toBe('never')
    // `true`/`false` were the first spelling of this field.
    expect(resolveConfig({ builtinSettingsForm: false }).builtinSettingsForm).toBe('never')
    expect(resolveConfig({ builtinSettingsForm: true }).builtinSettingsForm).toBe('always')
    // Anything unknown lands on the safe default rather than disabling anything.
    expect(resolveConfig({ builtinSettingsForm: 'nonsense' }).builtinSettingsForm).toBe('auto')
    expect(resolveConfig({ builtinSettingsForm: 7 }).builtinSettingsForm).toBe('auto')
    // Volatile references are read like every other field.
    expect(resolveConfig({ builtinSettingsForm: { get: () => 'never' } }).builtinSettingsForm).toBe('never')
  })

  it('marks every field volatile so the host can render and apply it live', () => {
    const fields = rootFields(Config.toJSON() as unknown as SchemaJson)
    expect(Object.keys(fields).sort()).toEqual([
      'applyOnStart',
      'builtinSettingsForm',
      'cachePath',
      'cacheTTLHours',
      'dryRun',
      'mapping',
      'modelsDevUrl',
      'requireCompleteMapping',
    ])
    for (const [field, node] of Object.entries(fields)) {
      expect(node.meta?.volatile, `${field} must be volatile`).toBe(true)
    }
  })

  it('accepts a nested mapping table', () => {
    const mapping = { 'my-gateway': { 'fast-model': 'google/gemini-flash-latest' } }
    // Volatile fields come back as live references, which is how the loader
    // hands them to apply() — read through get() the way the plugin does.
    const parsed = Config({ mapping }) as { mapping: { get: () => unknown } }
    expect(parsed.mapping.get()).toEqual(mapping)
  })

  it('reads volatile fields through their live reference', () => {
    const resolved = resolveConfig({
      mapping: { get: () => ({ a: { b: 'openai/gpt-5.4' } }) },
      dryRun: { get: () => true },
      cacheTTLHours: { get: () => 0 },
    })
    expect(resolved.mapping).toEqual({ a: { b: 'openai/gpt-5.4' } })
    expect(resolved.dryRun).toBe(true)
    expect(resolved.cacheTTLHours).toBe(0)
  })

  it('discards a mapping that is not a string table', () => {
    expect(resolveConfig({ mapping: { a: { b: 42 } } }).mapping).toEqual({})
    expect(resolveConfig({ mapping: { a: 'openai/gpt-5.4' } }).mapping).toEqual({})
    expect(resolveConfig({ mapping: [] }).mapping).toEqual({})
    expect(resolveConfig({ mapping: null }).mapping).toEqual({})
  })

  it('falls back to the defaults for out-of-range values', () => {
    expect(resolveConfig({ cacheTTLHours: -1 }).cacheTTLHours).toBe(24)
    expect(resolveConfig({ cacheTTLHours: Number.NaN }).cacheTTLHours).toBe(24)
    expect(resolveConfig({ applyOnStart: null }).applyOnStart).toBe(true)
    expect(resolveConfig({ requireCompleteMapping: null }).requireCompleteMapping).toBe(true)
  })
})
