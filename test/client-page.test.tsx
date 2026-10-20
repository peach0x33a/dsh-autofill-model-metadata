/**
 * The settings page container: its load/save state machine.
 *
 * This file exists because the container had no test at all, which is how three
 * real defects survived review: a phantom "unsaved" state, a failed pass
 * reported as a fill, and a disabled button the host would have accepted. The
 * container is where the mapping the page shows and the mapping it saves are
 * decided, so that decision is what these tests drive.
 *
 * `fetch` is stubbed globally: the container talks to this plugin's own host
 * endpoints through it.
 */
// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COPY_NS, makeT, zh } from '../src/client/copy.ts'
import { MetadataPage } from '../src/client/page.tsx'
import type { ReportedRoute } from '../src/client/api.ts'
import { platformTranslator } from './stubs/locale.ts'
import { stubFetch, type EndpointAnswers } from './stubs/fetch.ts'

/** A route with one mapped model and one gap. */
const REPORT: ReportedRoute = {
  route: 'gw',
  displayName: 'gw',
  settingsNs: 'llm-pi-ai',
  configured: true,
  mapped: true,
  resolved: true,
  orphans: [],
  errors: [],
  counts: { models: 2, mapped: 0, filled: 1, unchanged: 0, unmapped: 1, invalid: 0 },
  models: [
    { id: 'a', declared: [], source: 'openai/gpt-5.4', state: 'filled', filled: { name: 'GPT-5.4' } },
    { id: 'b', declared: [], state: 'unmapped', filled: {} },
  ],
}

/** The translator the page really gets. */
const t = makeT(platformTranslator({ [COPY_NS]: zh })(COPY_NS))

/**
 * Type into a React-controlled input.
 *
 * React tracks the previous value on the DOM node, so assigning `.value` and
 * dispatching `input` does nothing; going through the native setter is what makes
 * React see a change.
 */
async function type(input: HTMLInputElement | HTMLTextAreaElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(
    input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value',
  )?.set
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/** Render the page over canned endpoint answers. */
function mount(answers: EndpointAnswers, props: Record<string, unknown> = {}) {
  const stub = stubFetch(answers)
  vi.stubGlobal('fetch', stub.fetch)
  const view = render(<MetadataPage t={t} {...props} />)
  return { ...stub, view }
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  // happy-dom keeps its own timers and event-loop handles alive. Closing the
  // window is what releases them: without it the worker finishes every test,
  // reports green, and then never exits — a hung CI job no assertion can catch.
  window.close()
})

describe('MetadataPage', () => {
  it('shows the mapping the host reports, with the gap it has', async () => {
    mount({
      status: { ok: true, revision: 4, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 4, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
    })

    await waitFor(() => expect(screen.getByDisplayValue('openai/gpt-5.4')).toBeTruthy())
    expect(screen.getByText('b')).toBeTruthy()
    expect(screen.getByText(/补齐后才能保存并填充/)).toBeTruthy()
  })

  it('does not invent unsaved work when the two answers disagree', async () => {
    // `/inspect` fetches the catalog before answering, so the document can move
    // between the two calls. The page must take the newer answer as the truth and
    // not present the difference as an edit the operator never made — which would
    // enable Save and let a stale table overwrite the newer one.
    mount({
      status: { ok: true, revision: 4, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: {
        ok: true,
        revision: 5,
        resolved: true,
        mapping: { gw: { a: 'openai/gpt-5.4' }, other: { z: 'openai/gpt-5.4' } },
        reports: [REPORT],
      },
    })

    await waitFor(() => expect(screen.getAllByText('已保存').length).toBeGreaterThan(0))
    expect(screen.queryByText('有未保存修改')).toBeNull()
  })

  it('sends the revision it read, so the host can refuse a stale write', async () => {
    const { calls } = mount({
      status: { ok: true, revision: 7, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 7, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      mapping: { ok: true, mapping: { gw: { a: 'openai/gpt-5.4' } } },
    })

    await waitFor(() => expect(screen.getByDisplayValue('openai/gpt-5.4')).toBeTruthy())
    await type(screen.getByDisplayValue('openai/gpt-5.4') as HTMLInputElement, 'openai/gpt-4o')

    const save = screen.getByText('保存映射')
    await act(async () => {
      save.click()
    })
    await waitFor(() => {
      const posted = calls.find((call) => call.url.endsWith('/mapping'))
      expect(posted?.body).toContain('"revision":7')
    })
  })

  it('never calls a failed pass a fill', async () => {
    // The save landed but the pass threw: `applied` is undefined and `applyError`
    // carries the reason. Saying "saved and applied" would claim a fill that
    // never happened.
    mount({
      status: { ok: true, revision: 2, mapping: { gw: { a: 'openai/gpt-5.4', b: 'openai/gpt-4o' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 2, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4', b: 'openai/gpt-4o' } }, reports: [REPORT] },
      mapping: { ok: true, mapping: { gw: { a: 'openai/gpt-5.4', b: 'openai/gpt-4o' } }, applyError: 'ENOTFOUND' },
    })

    await waitFor(() => expect(screen.getByText('保存并填充')).toBeTruthy())
    await act(async () => {
      screen.getByText('保存并填充').click()
    })
    await waitFor(() => expect(screen.getByText(/映射已保存，但填充失败：ENOTFOUND/)).toBeTruthy())
    expect(screen.queryByText('映射已保存并填充。')).toBeNull()
  })

  it('reports a dry run as a dry run', async () => {
    mount({
      status: { ok: true, revision: 2, dryRun: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 2, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      mapping: { ok: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, applied: ['gw: would apply (a: name)'] },
    })

    await waitFor(() => expect(screen.getByText('保存并填充')).toBeTruthy())
    await act(async () => {
      screen.getByText('保存并填充').click()
    })
    await waitFor(() => expect(screen.getByText(/试运行/)).toBeTruthy())
  })

  it('enables save-and-fill when the host would accept the gap', async () => {
    // `requireCompleteMapping: false`: the host fills what it can and leaves the
    // unmapped model alone. The button must be usable, or the page withholds an
    // action the host would accept.
    mount({
      status: {
        ok: true,
        revision: 1,
        requireCompleteMapping: false,
        mapping: { gw: { a: 'openai/gpt-5.4' } },
        reports: [REPORT],
      },
      inspect: {
        ok: true,
        revision: 1,
        resolved: true,
        mapping: { gw: { a: 'openai/gpt-5.4' } },
        reports: [REPORT],
      },
    })

    await waitFor(() => expect(screen.getByText('保存并填充')).toBeTruthy())
    const button = screen.getByText('保存并填充').closest('button')
    expect(button?.disabled).toBe(false)
  })

  it('keeps unsaved edits when the page reloads', async () => {
    const { calls } = mount({
      status: { ok: true, revision: 1, mapping: {}, reports: [REPORT] },
      inspect: { ok: true, revision: 1, resolved: true, mapping: {}, reports: [REPORT] },
    })

    await waitFor(() => expect(screen.getByText('重新加载')).toBeTruthy())
    await type(screen.getByLabelText('a models.dev 来源') as HTMLInputElement, 'openai/gpt-4o')
    await waitFor(() => expect(screen.getAllByText('有未保存修改').length).toBeGreaterThan(0))

    await act(async () => {
      screen.getByText('重新加载').click()
    })
    await waitFor(() => expect(calls.filter((call) => call.url.endsWith('/status')).length).toBeGreaterThan(1))
    expect(screen.getByDisplayValue('openai/gpt-4o')).toBeTruthy()
  })

  it('folds and unfolds a route card without losing the draft state', async () => {
    mount({
      status: { ok: true, revision: 1, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 1, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
    })

    await waitFor(() => expect(screen.getByDisplayValue('openai/gpt-5.4')).toBeTruthy())
    const toggle = screen.getByRole('button', { name: /gw/ })
    await act(async () => {
      toggle.click()
    })
    expect(screen.queryByDisplayValue('openai/gpt-5.4')).toBeNull()
    await act(async () => {
      screen.getByRole('button', { name: /gw/ }).click()
    })
    expect(screen.getByDisplayValue('openai/gpt-5.4')).toBeTruthy()
  })

  it('applies one route from its card, using the route-scoped endpoint', async () => {
    // A complete route is the one case where a per-card pass does something, so
    // this is where the card action is worth proving: it must send the route,
    // not run the whole table.
    const complete: ReportedRoute = {
      ...REPORT,
      counts: { models: 2, mapped: 0, filled: 2, unchanged: 0, unmapped: 0, invalid: 0 },
      models: [
        { id: 'a', declared: [], source: 'openai/gpt-5.4', state: 'filled', filled: { name: 'GPT-5.4' } },
        { id: 'b', declared: [], source: 'openai/gpt-4o', state: 'filled', filled: { name: 'GPT-4o' } },
      ],
    }
    const mapping = { gw: { a: 'openai/gpt-5.4', b: 'openai/gpt-4o' } }
    const { calls } = mount({
      status: { ok: true, revision: 3, mapping, reports: [complete] },
      inspect: { ok: true, revision: 3, resolved: true, mapping, reports: [complete] },
      apply: { ok: true, results: [], log: ['gw: would apply (b: name)'], routes: [complete] },
    })

    await waitFor(() => expect(screen.getByText('填充此路由')).toBeTruthy())
    await act(async () => {
      screen.getByText('填充此路由').click()
    })
    await waitFor(() => {
      const posted = calls.find((call) => call.url.endsWith('/apply'))
      expect(posted?.body).toContain('"route":"gw"')
    })
  })

  it('closes the picker without changing the mapping', async () => {
    mount({
      status: { ok: true, revision: 1, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
      inspect: { ok: true, revision: 1, resolved: true, mapping: { gw: { a: 'openai/gpt-5.4' } }, reports: [REPORT] },
    })

    await waitFor(() => expect(screen.getAllByLabelText('搜索目录').length).toBeGreaterThan(0))
    await act(async () => {
      screen.getAllByLabelText('搜索目录')[0].click()
    })
    await waitFor(() => expect(screen.getByText('取消')).toBeTruthy())
    await act(async () => {
      screen.getByText('取消').click()
    })
    await waitFor(() => expect(screen.queryByText('取消')).toBeNull())
  })

})
