import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applyRoutes, readAt, TARGET_NS } from '../src/core/apply.ts'
import type { ProviderRow, SettingsOp, SettingsSeam, SettingsView } from '../src/core/types.ts'
import { CATALOG } from './fixtures.ts'

/**
 * A stub settings seam that *enforces* the revision fence.
 *
 * Recording the revision is not enough to test a compare-and-set: a stub that
 * accepts every write would let a stale-plan clobber pass unnoticed, which is
 * exactly the bug this double exists to catch. Writing at any revision other
 * than the current one throws, the way the real service does.
 */
function stubSettings(initial: SettingsView, options: { bumpOnMutate?: boolean } = {}) {
  const view: SettingsView = { ...initial }
  const calls: Array<{ ns: string; ops: SettingsOp[]; revision: number }> = []
  const describe = vi.fn(() => [{ ...view }])
  const mutate = vi.fn(async (ns: string, ops: SettingsOp[], revision: number) => {
    calls.push({ ns, ops, revision })
    if (revision !== view.revision) {
      throw new Error(`SETTINGS_CONFLICT: expected revision ${view.revision}, got ${revision}`)
    }
    if (options.bumpOnMutate === true) view.revision += 1
    return true
  })
  return { settings: { describe, mutate } as SettingsSeam, view, calls }
}

/** The provider directory row for one configured gateway route. */
function row(provider: string): ProviderRow {
  return { provider, displayName: provider, settingsNs: TARGET_NS, settingsPath: ['providers', provider], declared: true }
}

/** A namespace view holding one configured route. */
function viewWith(provider: string, models: unknown[]): SettingsView {
  return {
    ns: TARGET_NS,
    revision: 7,
    value: { providers: { [provider]: { api: 'openai-completions', baseURL: 'https://gw/v1', models } } },
  }
}

const MAPPING = { 'my-gateway': { 'fast-model': 'google/gemini-flash-latest' } }

describe('readAt', () => {
  it('walks a path and returns undefined off the end', () => {
    expect(readAt({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
    expect(readAt({ a: 1 }, ['a', 'b'])).toBeUndefined()
    expect(readAt(undefined, ['a'])).toBeUndefined()
  })
})

describe('concurrent edits during a pass', () => {
  /** A seam whose route gains a hand-written model on the Nth read. */
  function racing(initial: SettingsView, addOnRead: number, model: unknown) {
    const view: SettingsView = { ...initial }
    let reads = 0
    const calls: Array<{ ops: SettingsOp[]; revision: number }> = []
    const describe = vi.fn(() => {
      reads += 1
      if (reads === addOnRead) {
        const providers = (view.value as { providers: Record<string, { models: unknown[] }> }).providers
        providers.gw.models = [...providers.gw.models, model]
        // A real edit is a document write, so it moves the revision too.
        view.revision += 1
      }
      return [{ ...view }]
    })
    const mutate = vi.fn(async (_ns: string, ops: SettingsOp[], revision: number) => {
      if (revision !== view.revision) throw new Error(`SETTINGS_CONFLICT: got ${revision}, at ${view.revision}`)
      calls.push({ ops, revision })
      // Apply the write, the way the real service does: without this the stub
      // would keep the operator's model no matter what the pass wrote, and the
      // clobber this test exists to catch would be invisible.
      for (const op of ops) {
        const providers = (view.value as { providers: Record<string, Record<string, unknown>> }).providers
        providers.gw.models = op.value as unknown[]
      }
      view.revision += 1
      return true
    })
    return { settings: { describe, mutate } as SettingsSeam, view, calls }
  }

  it('never drops a model the operator added while the pass was planning', async () => {
    // The pass is a whole-array `set`: a plan built before this edit would delete
    // the hand-written model outright. Re-planning inside the fence must instead
    // notice the change and refuse.
    const host = racing(viewWith('gw', [{ id: 'a' }]), 2, { id: 'Y', name: 'hand-written' })
    const outcomes = await applyRoutes({
      settings: host.settings,
      providers: [row('gw')],
      mapping: { gw: { a: 'openai/gpt-5.4' } },
      catalog: CATALOG,
      dryRun: false,
      requireCompleteMapping: false,
    })

    const models = (host.view.value as { providers: Record<string, { models: Array<{ id: string; name?: string }> }> })
      .providers.gw.models
    expect(models.map((entry) => entry.id)).toEqual(['a', 'Y'])
    expect(models[1].name).toBe('hand-written')
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].reason).toContain('changed while it was being filled')
  })

  it('still fills when nothing moved', async () => {
    const host = stubSettings(viewWith('gw', [{ id: 'a' }]))
    const outcomes = await applyRoutes({
      settings: host.settings,
      providers: [row('gw')],
      mapping: { gw: { a: 'openai/gpt-5.4' } },
      catalog: CATALOG,
      dryRun: false,
      requireCompleteMapping: false,
    })
    expect(outcomes[0].status).toBe('applied')
    expect(host.calls).toHaveLength(1)
  })
})

describe('applyRoutes', () => {
  let harness: ReturnType<typeof stubSettings>

  beforeEach(() => {
    harness = stubSettings(viewWith('my-gateway', [{ id: 'fast-model' }]))
  })

  it('writes one atomic op for the whole models array, fenced by the read revision', async () => {
    const outcomes = await applyRoutes({
      settings: harness.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0].status).toBe('applied')
    expect(harness.calls).toHaveLength(1)
    expect(harness.calls[0].ns).toBe(TARGET_NS)
    expect(harness.calls[0].revision).toBe(7)
    expect(harness.calls[0].ops).toEqual([
      {
        op: 'set',
        path: ['providers', 'my-gateway', 'models'],
        value: [
          {
            id: 'fast-model',
            name: 'Gemini Flash Latest',
            contextWindow: 1048576,
            maxTokens: 65536,
            input: ['text', 'image'],
            reasoningEfforts: { low: 'low', medium: 'medium', high: 'high' },
          },
        ],
      },
    ])
    expect(outcomes[0].applied[0].filledFields).toContain('contextWindow')
  })

  it('re-reads the revision before writing, so a concurrent bump does not fence it out', async () => {
    harness.settings.describe = vi
      .fn()
      .mockReturnValueOnce([viewWith('my-gateway', [{ id: 'fast-model' }])])
      .mockReturnValue([{ ...viewWith('my-gateway', [{ id: 'fast-model' }]), revision: 9 }])

    await applyRoutes({
      settings: harness.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(harness.calls[0].revision).toBe(9)
  })

  it('prefers the user layer over the resolved layer for the merge base', async () => {
    const view: SettingsView = {
      ns: TARGET_NS,
      revision: 3,
      value: { providers: { 'my-gateway': { models: [{ id: 'fast-model', contextWindow: 1 }] } } },
      user: { providers: { 'my-gateway': { models: [{ id: 'fast-model', contextWindow: 999 }] } } },
    }
    const local = stubSettings(view)
    await applyRoutes({
      settings: local.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    const written = local.calls[0].ops[0].value as Array<Record<string, unknown>>
    expect(written[0].contextWindow).toBe(999)
  })

  it('refuses a mapped route the host does not offer', async () => {
    const outcomes = await applyRoutes({
      settings: harness.settings,
      providers: [row('other-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].reason).toContain('not a configurable provider')
    expect(harness.calls).toHaveLength(0)
  })

  it('refuses when the namespace is not registered', async () => {
    const outcomes = await applyRoutes({
      settings: { describe: () => [], mutate: async () => undefined },
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].reason).toContain('not registered')
  })

  it('refuses when the route is declared but not configured', async () => {
    const empty = stubSettings({ ns: TARGET_NS, revision: 1, value: { providers: {} } })
    const outcomes = await applyRoutes({
      settings: empty.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].reason).toContain('not configured')
    expect(empty.calls).toHaveLength(0)
  })

  it('writes nothing when the plan is refused', async () => {
    const outcomes = await applyRoutes({
      settings: harness.settings,
      providers: [row('my-gateway')],
      mapping: { 'my-gateway': { 'fast-model': 'openai/gpt-9' } },
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].errors[0].kind).toBe('unknown-model')
    expect(harness.calls).toHaveLength(0)
  })

  it('reports a dry run without writing', async () => {
    const outcomes = await applyRoutes({
      settings: harness.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
      dryRun: true,
    })
    expect(outcomes[0].status).toBe('dry-run')
    expect(outcomes[0].applied[0].filledFields.length).toBeGreaterThan(0)
    expect(harness.calls).toHaveLength(0)
  })

  it('writes nothing when every field is already declared', async () => {
    const complete = stubSettings(
      viewWith('my-gateway', [
        {
          id: 'fast-model',
          name: 'n',
          contextWindow: 1,
          maxTokens: 1,
          input: ['text'],
          reasoningEfforts: false,
        },
      ]),
    )
    const outcomes = await applyRoutes({
      settings: complete.settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('unchanged')
    expect(complete.calls).toHaveLength(0)
  })

  it('reports a refused settings write with its message', async () => {
    const settings: SettingsSeam = {
      describe: () => [viewWith('my-gateway', [{ id: 'fast-model' }])],
      mutate: async () => {
        throw new Error('Config field "providers" is not volatile')
      },
    }
    const outcomes = await applyRoutes({
      settings,
      providers: [row('my-gateway')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(outcomes[0].status).toBe('refused')
    expect(outcomes[0].reason).toContain('not volatile')
  })

  it('keeps routes independent: one refusal does not block another', async () => {
    const view: SettingsView = {
      ns: TARGET_NS,
      revision: 2,
      value: {
        providers: {
          'my-gateway': { models: [{ id: 'fast-model' }] },
          'other-gateway': { models: [{ id: 'reasoner' }] },
        },
      },
    }
    const local = stubSettings(view)
    const outcomes = await applyRoutes({
      settings: local.settings,
      providers: [row('my-gateway'), row('other-gateway')],
      mapping: {
        'my-gateway': { 'fast-model': 'openai/gpt-9' },
        'other-gateway': { reasoner: 'openai/gpt-5.4' },
      },
      catalog: CATALOG,
    })
    expect(outcomes.map((outcome) => outcome.status)).toEqual(['refused', 'applied'])
    expect(local.calls).toHaveLength(1)
  })

  it('touches nothing when the mapping is empty', async () => {
    const outcomes = await applyRoutes({
      settings: harness.settings,
      providers: [row('my-gateway')],
      mapping: {},
      catalog: CATALOG,
    })
    expect(outcomes).toEqual([])
    expect(harness.calls).toHaveLength(0)
  })

  it('keeps unrelated routes out of the write even when they share the namespace', async () => {
    const view: SettingsView = {
      ns: TARGET_NS,
      revision: 5,
      value: {
        providers: {
          'my-gateway': { models: [{ id: 'fast-model' }] },
          untouched: { models: [{ id: 'x' }] },
        },
      },
    }
    const local = stubSettings(view)
    await applyRoutes({
      settings: local.settings,
      providers: [row('my-gateway'), row('untouched')],
      mapping: MAPPING,
      catalog: CATALOG,
    })
    expect(local.calls[0].ops[0].path).toEqual(['providers', 'my-gateway', 'models'])
  })
})
