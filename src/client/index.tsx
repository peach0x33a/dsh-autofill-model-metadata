/**
 * The browser half: a graphical settings page for this plugin.
 *
 * Registration follows the shape the shipped client bundles use: wait for the
 * `settings.section` slot to be declared, then register one entry — that is what
 * puts a "Model metadata" row in the DSH Settings navigation. The component
 * talks to this plugin's own host endpoints over same-origin `fetch`, so the
 * page needs no client RPC service and no `configForms` binding.
 *
 * The host side is told the page loaded (`POST /page-live`), which is what
 * releases it from generating its own settings form under the default `auto`
 * policy: the better surface is used when it works, and the original form stays
 * as the fallback when it does not.
 *
 * @module dsh-autofill-model-metadata/client
 */

import type { ReactNode } from 'react'

import { makeT, fallbackFor, zh, en, COPY_NS, type Translate } from './copy.ts'
import { MetadataPage, PageBoundary, setFallbackTranslator } from './page.tsx'
import { API_BASE, type FetchLike } from './api.ts'

/** Must match the package name, the tsdown banner, and the loader row id. */
export const name = 'dsh-autofill-model-metadata'

/** Cordis client service names this half composes with. */
export const inject = ['slots', 'locale']

/** The slot this page occupies: one row in the Settings navigation. */
const SLOT = 'settings.section'

/** The id of this plugin's own Settings entry. */
const SECTION_ID = 'autofill-model-metadata'

/** Where the entry sits among the built-in sections. */
const SECTION_ORDER = 100

/**
 * The registered component: the page under its own render-fault boundary.
 *
 * The host's slot renderer already isolates a failing registration, but it shows
 * nothing when one fails — so this page carries its own boundary and turns any
 * fault into a readable message instead of an empty settings pane.
 */
function AutofillSection(props: { t?: unknown }): ReactNode {
  const t = (props.t as Translate | undefined) ?? makeT(undefined, en)
  return (
    <PageBoundary t={t}>
      <MetadataPage {...props} />
    </PageBoundary>
  )
}

/** The context surface this half uses, structurally. */
interface ClientContext {
  effect?: (callback: () => void | (() => void), label?: string) => void
  locale?: {
    register?: (ns: string, dictionaries: Record<string, unknown>) => unknown
    bind?: (ns: string) => unknown
  }
  slots?: {
    inject?: (slot: string, callback: () => unknown) => unknown
    register?: (options: Record<string, unknown>, component: unknown) => unknown
  }
  logger?: { warn?: (...args: unknown[]) => void; info?: (...args: unknown[]) => void }
}

/**
 * Tell the host the page loaded.
 *
 * Fire-and-forget: a failure here must not break the page, and an old host that
 * does not answer simply keeps its generated settings form.
 */
function reportLive(fetcher: FetchLike = (input, init) => fetch(input, init)): void {
  void fetcher(`${API_BASE}/page-live`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    .then(
      () => undefined,
      () => undefined,
    )
}

/** Mount the page. */
export function apply(ctx: ClientContext): void {
  // The page's own copy, used when no translator is bound to the slot.
  setFallbackTranslator(makeT(undefined, fallbackFor(
    (ctx.locale as { getSnapshot?: () => { active?: unknown } } | undefined)?.getSnapshot?.().active,
  )))

  // The active locale decides which bundled dictionary backs the copy the host
  // cannot answer for; guessing Chinese would put Chinese labels on an English
  // deployment.
  const active = (ctx.locale as { getSnapshot?: () => { active?: unknown } } | undefined)?.getSnapshot?.().active
  const table = fallbackFor(active)
  let t = makeT(undefined, table)
  if (ctx.locale?.register !== undefined) {
    // Registering the same (namespace, locale) twice throws, so it happens once
    // inside an effect, the way every shipped client plugin does it.
    ctx.effect?.(() => {
      ctx.locale?.register?.(COPY_NS, { zh, en })
    }, `${name}: dictionaries`)
    const bound = ctx.locale.bind?.(COPY_NS)
    if (bound !== undefined) t = makeT(bound, table)
  }

  ctx.slots?.inject?.(SLOT, () =>
    ctx.slots?.register?.(
      {
        name: SLOT,
        id: SECTION_ID,
        order: SECTION_ORDER,
        // A thunk: the shell re-reads it when the locale revision moves.
        label: () => t('nav'),
        locale: COPY_NS,
      },
      AutofillSection,
    ),
  )

  ctx.effect?.(() => {
    reportLive()
  }, `${name}: announce the settings page`)
}
