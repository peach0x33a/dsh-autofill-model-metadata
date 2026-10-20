/**
 * The settings page, stateful half.
 *
 * Owns the draft mapping, the catalogs and the in-flight flags, and turns every
 * user gesture into one of the host endpoints. All decisions about *what* to
 * show live in {@link ./model.ts}, so this file is wiring only.
 *
 * The draft is kept separate from the host's mapping so that "unsaved changes"
 * is a real, visible state: nothing is written until Save, and a save sends the
 * whole table in one revision-fenced write.
 *
 * @module dsh-autofill-model-metadata/client/page
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  ApiError,
  applyNow,
  fetchInspect,
  fetchStatus,
  saveMapping,
  searchCatalog,
  type ReportedRoute,
  type StatusAnswer,
} from './api.ts'
import type { Translate } from './copy.ts'
import {
  adoptDraft,
  formatFetchedAt,
  cardsFor,
  coverageOf,
  sameMapping,
  summarizePass,
  withSource,
  type Mapping,
} from './model.ts'
import { MetadataView, type PageInfo, type SearchState } from './view.tsx'

/** Debounce window for the per-row catalog search. */
const SEARCH_DEBOUNCE_MS = 200

/** How many catalog candidates one search asks for. */
const SEARCH_LIMIT = 30

/** Where the bundle's `fetch` calls go when no override is given. */
const globalFetch: typeof fetch = (input, init) => fetch(input, init)

/** Props the slot kit passes in. */
export interface PageProps {
  /** Bound from the slot's `locale` option; absent on a bare host. */
  t?: unknown
}

/** The page component. */
export function MetadataPage(props: PageProps = {}): ReactNode {
  const t = props.t as Translate | undefined
  const translate = useMemo<Translate>(() => makeTranslator(t), [t])

  const [status, setStatus] = useState<StatusAnswer | undefined>(undefined)
  const [reports, setReports] = useState<ReportedRoute[]>([])
  const [resolved, setResolved] = useState(false)
  const [catalogError, setCatalogError] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState<Mapping>({})
  const [saved, setSaved] = useState<Mapping>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [unmappedOnly, setUnmappedOnly] = useState(false)
  const [searches, setSearches] = useState<Record<string, SearchState>>({})
  /**
   * The settings revision the displayed mapping was read at.
   *
   * Sent back with a save so the host can refuse a write made against a document
   * that has since moved — otherwise an edit made in the config document while
   * this page sat open would be silently replaced by what the page shows.
   */
  const [revision, setRevision] = useState<number | undefined>(undefined)

  /** Monotonic guard so a slow answer never overwrites a newer one. */
  const generation = useRef(0)
  /** The host's table as of the last answer, readable inside `load`. */
  const savedRef = useRef<Mapping>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  /** Load the whole picture: the unresolved status, then the resolved report. */
  const load = useCallback(async (): Promise<void> => {
    const mine = ++generation.current
    setLoading(true)
    setError(undefined)
    let fromStatus: Mapping | undefined
    try {
      const base = await fetchStatus(globalFetch)
      if (mine !== generation.current) return
      setStatus(base)
      // The draft is the operator's work: only adopt the host's table when there
      // is no local edit to lose. `saved` always follows the host.
      fromStatus = base.mapping
      setDraft((current) => adoptDraft(current, savedRef.current, base.mapping))
      setSaved(base.mapping)
      setRevision(base.revision)
      setReports(base.reports)
      setResolved(base.resolved)
      setCatalogError(undefined)
    } catch (failure) {
      if (mine !== generation.current) return
      setError(explain(failure))
      setLoading(false)
      return
    }
    try {
      const inspected = await fetchInspect(globalFetch)
      if (mine !== generation.current) return
      setReports(inspected.reports)
      setResolved(inspected.resolved)
      setCatalogError(inspected.catalogError)
      // `/inspect` answers later than `/status` — it fetches the catalog first —
      // so if the two disagree, the *document* moved in between. Take both the
      // table and the revision from this newer answer, and drop the stale report
      // rather than showing the difference as unsaved work the operator never did.
      setSaved(inspected.mapping)
      setRevision(inspected.revision)
      setDraft((current) => adoptDraft(current, fromStatus ?? savedRef.current, inspected.mapping))
    } catch (failure) {
      if (mine !== generation.current) return
      // The unresolved report the first call produced is still worth showing.
      setResolved(false)
      setCatalogError(explain(failure))
    } finally {
      if (mine === generation.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    savedRef.current = saved
  }, [saved])

  // Cancel any pending catalog search when the page goes away: a live debounce
  // would keep the process holding a timer, and would set state on a dead tree.
  useEffect(
    () => () => {
      for (const timer of Object.values(timers.current)) clearTimeout(timer)
      timers.current = {}
    },
    [],
  )

  /** Edit one mapping entry locally. */
  const edit = useCallback((route: string, modelId: string, value: string): void => {
    setDraft((current) => withSource(current, route, modelId, value))
  }, [])

  /** Open the picker for one row and search with what the field already holds. */
  const search = useCallback((route: string, modelId: string, query: string): void => {
    const key = `${route}\u0000${modelId}`
    setSearches((current) => ({
      ...current,
      [key]: { query, open: true, loading: true, candidates: current[key]?.candidates ?? [] },
    }))
    const existing = timers.current[key]
    if (existing !== undefined) clearTimeout(existing)
    timers.current[key] = setTimeout(() => {
      void searchCatalog(globalFetch, query, SEARCH_LIMIT)
        .then((answer) => {
          setSearches((current) => ({
            ...current,
            [key]: { query, open: true, loading: false, candidates: answer.candidates },
          }))
        })
        .catch((failure: unknown) => {
          setSearches((current) => ({
            ...current,
            [key]: { query, open: true, loading: false, candidates: [], error: explain(failure) },
          }))
        })
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  /** Adopt one candidate as the mapping for a row, and close the picker. */
  const pick = useCallback(
    (route: string, modelId: string, source: string): void => {
      edit(route, modelId, source)
      const key = `${route}\u0000${modelId}`
      const pending = timers.current[key]
      if (pending !== undefined) {
        clearTimeout(pending)
        delete timers.current[key]
      }
      setSearches((current) => ({ ...current, [key]: { query: source, open: false, loading: false, candidates: [] } }))
    },
    [edit],
  )

  /** Persist the draft, optionally running an apply pass in the same call. */
  const save = useCallback(
    async (apply: boolean): Promise<void> => {
      setSaving(true)
      setError(undefined)
      setMessage(undefined)
      try {
        const answer = await saveMapping(globalFetch, draft, apply, revision)
        setSaved(answer.mapping)
        setDraft(answer.mapping)
        if (answer.routes !== undefined) setReports(answer.routes)
        setRevision((current) => current)
        if (!apply) {
          setMessage(translate('saved'))
        } else if (answer.applyError !== undefined) {
          // The save landed; the pass is what failed, and saying "applied" here
          // would claim a fill that never happened.
          setMessage(translate('savedApplyFailed', { reason: answer.applyError }))
        } else {
          const pass = summarizePass(answer.applied ?? [])
          setMessage(
            pass.kind === 'refused'
              ? translate('savedRefused', { route: pass.route ?? '' })
              : pass.kind === 'dry-run'
                ? translate('savedDryRun')
                : pass.kind === 'unchanged'
                  ? translate('savedNothing')
                  : translate('savedApplied'),
          )
        }
        if (apply) {
          const next = await fetchInspect(globalFetch)
          setReports(next.reports)
          setResolved(next.resolved)
          setCatalogError(next.catalogError)
        }
      } catch (failure) {
        setError(explain(failure))
      } finally {
        setSaving(false)
      }
    },
    [draft, revision, translate],
  )

  /** Close one row's picker without choosing a record. */
  const closeSearch = useCallback((route: string, modelId: string): void => {
    const key = `${route}\u0000${modelId}`
    const existing = timers.current[key]
    if (existing !== undefined) {
      clearTimeout(existing)
      delete timers.current[key]
    }
    setSearches((current) => ({
      ...current,
      [key]: { query: current[key]?.query ?? '', open: false, loading: false, candidates: [] },
    }))
  }, [])

  /** Run a pass over the saved mapping: every route, or just one. */
  const runPass = useCallback(
    async (route?: string): Promise<void> => {
      setSaving(true)
      setError(undefined)
      setMessage(undefined)
      try {
        const answer = await applyNow(globalFetch, route)
        if (answer.routes !== undefined) setReports(answer.routes)
        setMessage(answer.log.length === 0 ? translate('applied') : answer.log.join(' | '))
      } catch (failure) {
        setError(explain(failure))
      } finally {
        setSaving(false)
      }
    },
    [translate],
  )

  const cards = useMemo(() => cardsFor(reports, draft, saved), [reports, draft, saved])
  const coverage = useMemo(
    () => coverageOf(cards, status?.requireCompleteMapping !== false),
    [cards, status?.requireCompleteMapping],
  )
  const dirty = useMemo(() => !sameMapping(draft, saved), [draft, saved])

  const info: PageInfo = {
    resolved,
    catalogProviderCount: status?.catalog?.providers,
    stale: status?.catalog?.stale,
    fromCache: status?.catalog?.fromCache,
    fetchedAt: formatFetchedAt(status?.catalog?.fetchedAt),
    catalogError,
    dryRun: status?.dryRun === true,
    builtinFormKept: true,
  }

  return (
    <MetadataView
      t={translate}
      loading={loading}
      error={error}
      info={info}
      cards={cards}
      coverage={coverage}
      dirty={dirty}
      saving={saving}
      message={message}
      unmappedOnly={unmappedOnly}
      searches={searches}
      onReload={() => void load()}
      onInspect={() => void load()}
      onApplyAll={() => void runPass()}
      onApplyRoute={(route) => void runPass(route)}
      onToggleUnmappedOnly={() => setUnmappedOnly((current) => !current)}
      onEdit={edit}
      onSearch={search}
      onCloseSearch={closeSearch}
      onPick={pick}
      onClear={(route, modelId) => edit(route, modelId, '')}
      onRemoveOrphan={(route, key) => edit(route, key, '')}
      onSave={(apply) => void save(apply)}
    />
  )
}

/**
 * A translator that falls back to the built-in dictionary.
 *
 * The slot kit binds `t` from the host's locale service, which resolves this
 * plugin's namespace. Anything it cannot answer — an unknown namespace, a key it
 * does not carry, an exception — falls back to the copy shipped in the bundle,
 * so the page never renders raw keys or dies on a locale problem.
 */
function makeTranslator(bound: Translate | undefined): Translate {
  if (bound === undefined) return fallbackTranslate
  return (key, params) => {
    try {
      const answer = bound(key, params)
      if (typeof answer === 'string' && answer !== key && answer.length > 0) return answer
    } catch {
      // fall through to the bundled copy
    }
    return fallbackTranslate(key, params)
  }
}

/**
 * A render fault boundary around the page.
 *
 * The slot host wraps every registration in an error boundary, but it renders
 * nothing on failure: a fault in this page would appear as an empty settings
 * pane with no clue why. Catching it here keeps the diagnosis on screen and
 * points at the settings document, which always remains editable.
 */
export class PageBoundary extends Component<{ t: Translate; children?: ReactNode }, { failure?: string }> {
  override state: { failure?: string } = {}

  /** Capture the message the next render should show. */
  static getDerivedStateFromError(failure: unknown): { failure: string } {
    return { failure: failure instanceof Error ? failure.message : String(failure) }
  }

  /** Log once, so the browser console carries the fault even if nobody reads it. */
  override componentDidCatch(failure: unknown): void {
    console.error('[dsh-autofill-model-metadata] settings page failed to render', failure)
  }

  override render(): ReactNode {
    if (this.state.failure === undefined) return this.props.children
    return (
      <div style={{ padding: 12, fontSize: 12, lineHeight: 1.6 }} role="alert">
        <div style={{ color: 'rgb(200,80,80)' }}>{this.props.t('crashed', { reason: this.state.failure })}</div>
        <div style={{ opacity: 0.75, marginTop: 4 }}>{this.props.t('crashedHint')}</div>
      </div>
    )
  }
}

/** The built-in copy, used when the slot kit bound no translator. */
let fallbackTranslate: Translate = (key) => String(key)

/**
 * Install the built-in dictionary.
 *
 * Called by the plugin entry with the page's own copy so this module does not
 * depend on it directly; keeping the import out of the component graph also
 * keeps the pure view testable on its own.
 */
export function setFallbackTranslator(translate: Translate): void {
  fallbackTranslate = translate
}

/** Turn any thrown value into something a person can read. */
function explain(failure: unknown): string {
  if (failure instanceof ApiError) return `${failure.status}: ${failure.message}`
  if (failure instanceof Error) return failure.message
  return String(failure)
}

