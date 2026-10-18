/**
 * Pure state helpers for the settings page.
 *
 * Everything the page decides — what a badge says, whether Save is usable, how
 * an edit changes the mapping, which models are still gaps — is a plain function
 * here, so it can be tested without a DOM or a browser.
 *
 * @module dsh-autofill-model-metadata/client/model
 */

import type { Candidate, ReportedModel, ReportedRoute } from './api.ts'

/** A `route → { modelId → source }` table, as the config carries it. */
export type Mapping = Record<string, Record<string, string>>

/** The identity of one table row, used as a React key and a search-state key. */
export function rowKey(route: string, modelId: string): string {
  return `${route}\u0000${modelId}`
}

/** What one row of the page shows. */
export interface ModelRow {
  modelId: string
  route: string
  /** The draft mapping value, or undefined when the model is unmapped. */
  source?: string
  /** The mapping value the host currently holds, for a dirty comparison. */
  savedSource?: string
  /** Whether the draft differs from what the host holds. */
  edited: boolean
  /** Fields the profile already declares. */
  declared: string[]
  /** Catalog values a pass would add. */
  filled: Record<string, unknown>
  state: ReportedModel['state']
  /** A refusal attached to this model, when there is one. */
  error?: ReportedModel['error']
}

/** What one route card shows. */
export interface RouteCard {
  route: string
  displayName: string
  configured: boolean
  reason?: string
  rows: ModelRow[]
  /** Mapping keys the *draft* has that name a model the route does not declare. */
  orphans: string[]
  /**
   * The refusals that still apply to what the page would send.
   *
   * A refusal the host reported against a value the operator has since edited is
   * dropped: it describes the saved config, not the draft, and leaving it in
   * would keep "Save and fill" disabled after the operator fixed the problem.
   * Saving re-validates against the host, so a wrong edit comes straight back.
   */
  errors: Array<{ kind: string; message: string; modelId?: string }>
  counts: ReportedRoute['counts']
  /** Whether a pass would write anything for this route. */
  writable: boolean
}

/** The mapping value for one model, or undefined. */
export function sourceOf(mapping: Mapping, route: string, modelId: string): string | undefined {
  return mapping[route]?.[modelId]
}

/**
 * Set or clear one mapping entry, immutably.
 *
 * An empty value removes the entry (and a route that becomes empty is dropped),
 * so a cleared field is indistinguishable from a key the operator never wrote —
 * which is what the completeness rule must see.
 *
 * @param mapping - the current table.
 * @param route - the route to edit.
 * @param modelId - the local model id to edit.
 * @param source - the new `provider/model`, or an empty string to clear it.
 * @returns a new table.
 */
export function withSource(mapping: Mapping, route: string, modelId: string, source: string): Mapping {
  const table = { ...(mapping[route] ?? {}) }
  const trimmed = source.trim()
  if (trimmed.length === 0) delete table[modelId]
  else table[modelId] = trimmed
  const next: Mapping = { ...mapping }
  if (Object.keys(table).length === 0) delete next[route]
  else next[route] = table
  return next
}

/** Whether two mappings carry the same entries (order-insensitive). */
export function sameMapping(left: Mapping, right: Mapping): boolean {
  const routes = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const route of routes) {
    const a = left[route] ?? {}
    const b = right[route] ?? {}
    const ids = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const id of ids) if (a[id] !== b[id]) return false
  }
  return true
}

/**
 * Decide what the draft becomes after the host's table is (re)read.
 *
 * The operator's unsaved edits are work: they are adopted only when the draft
 * held nothing beyond what the host already had. The moment the draft differs
 * from the saved table — including a cleared entry, which makes it differ by
 * *absence* — the reload leaves it alone, so pressing "Check against catalog"
 * cannot silently discard an edit.
 *
 * @param draft - the table as currently edited.
 * @param saved - the table as the host last held it.
 * @param incoming - the table just read from the host.
 * @returns the draft to show.
 */
export function adoptDraft(draft: Mapping, saved: Mapping, incoming: Mapping): Mapping {
  return sameMapping(draft, saved) ? incoming : draft
}

/** Turn one host-report into the row list the page renders. */
function rowsOf(report: ReportedRoute): ModelRow[] {
  return report.models.map((model) => ({
    modelId: model.id,
    route: report.route,
    source: model.source,
    savedSource: model.source,
    edited: false,
    declared: model.declared,
    filled: model.filled,
    state: model.state,
    error: model.error,
  }))
}

/** Turn one host-report into the card the page renders. */
function cardOf(report: ReportedRoute): RouteCard {
  return {
    route: report.route,
    displayName: report.displayName ?? report.route,
    configured: report.configured,
    reason: report.reason,
    rows: rowsOf(report),
    orphans: report.orphans,
    errors: report.errors,
    counts: report.counts,
    writable:
      report.configured &&
      report.errors.length === 0 &&
      report.models.some((model) => model.state === 'filled'),
  }
}

/**
 * Build the cards from the host report plus the local draft.
 *
 * The draft mapping is what the page shows, because it is what Save would send:
 * reading the display value back out of the report would resurrect a value the
 * operator just cleared. The report still supplies everything the page cannot
 * know locally — which fields are declared, what a pass would fill, which
 * refusals apply, and whether the catalog resolved.
 *
 * @param reports - the host's route reports.
 * @param draft - the mapping as currently edited.
 * @param saved - the mapping the host holds.
 */
export function cardsFor(reports: ReportedRoute[], draft: Mapping, saved: Mapping): RouteCard[] {
  return reports.map((report) => {
    const card = cardOf(report)
    const rows = report.models.map((model): ModelRow => {
      const source = sourceOf(draft, report.route, model.id)
      const savedSource = sourceOf(saved, report.route, model.id)
      return {
        modelId: model.id,
        route: report.route,
        source,
        savedSource,
        edited: source !== savedSource,
        declared: model.declared,
        filled: model.filled,
        state: model.state,
        error: model.error,
      }
    })

    const edited = new Set(rows.filter((row) => row.edited).map((row) => row.modelId))
    const drafted = new Set(Object.keys(draft[report.route] ?? {}))
    // Orphans are read from the draft, so removing one clears the refusal at once.
    const orphans = [...drafted].filter((key) => !rows.some((row) => row.modelId === key))
    // A refusal survives only while the value it describes is still what the page
    // would send: unmapped rows carry `missing-mapping` for the *absent* source,
    // which the operator closing the gap must clear immediately.
    const errors = card.errors.filter(
      (error) =>
        error.modelId === undefined || (drafted.has(error.modelId) && !edited.has(error.modelId)),
    )
    const gaps = rows.some((row) => row.source === undefined)
    return {
      ...card,
      rows,
      orphans,
      errors,
      writable: card.configured && !gaps && orphans.length === 0 && errors.length === 0 && rows.length > 0,
    }
  })
}

/**
 * The one-line summary of a route card.
 *
 * Counts are returned as keys rather than a finished sentence so the caller can
 * translate them: this module holds no copy, because copy that never reaches the
 * locale service cannot be translated or overridden.
 *
 * @param counts - the route's state counts.
 * @returns the parts to render, each with its count.
 */
export function summaryParts(counts: ReportedRoute['counts']): Array<{ key: SummaryKey; count: number }> {
  const parts: Array<{ key: SummaryKey; count: number }> = []
  if (counts.filled > 0) parts.push({ key: 'summaryFilled', count: counts.filled })
  if (counts.unchanged > 0) parts.push({ key: 'summaryUnchanged', count: counts.unchanged })
  if (counts.mapped > 0) parts.push({ key: 'summaryMapped', count: counts.mapped })
  if (counts.unmapped > 0) parts.push({ key: 'summaryUnmapped', count: counts.unmapped })
  if (counts.invalid > 0) parts.push({ key: 'summaryInvalid', count: counts.invalid })
  if (parts.length === 0) parts.push({ key: 'summaryModels', count: counts.models })
  return parts
}

/** The copy keys a route summary can use. */
export type SummaryKey =
  | 'summaryFilled'
  | 'summaryUnchanged'
  | 'summaryMapped'
  | 'summaryUnmapped'
  | 'summaryInvalid'
  | 'summaryModels'

/** What the draft mapping amounts to, counted across every card. */
export interface Coverage {
  models: number
  mapped: number
  unmapped: number
  /** Rows whose draft value differs from what the host holds. */
  edited: number
  /** Routes that a pass would refuse because a mapping is missing or wrong. */
  blockedRoutes: number
}

/**
 * Count the draft's coverage, which is what the footer summarises.
 *
 * `blockedRoutes` mirrors the *host's* refusal rules, including
 * `requireCompleteMapping`: with completeness turned off an unmapped model is
 * not a reason to refuse, so it must not be a reason to disable the button
 * either — otherwise the page withholds an action the host would accept.
 *
 * @param cards - the route cards, built from the draft.
 * @param requireCompleteMapping - the configured rule; defaults to the strict one.
 */
export function coverageOf(cards: RouteCard[], requireCompleteMapping = true): Coverage {
  const coverage: Coverage = { models: 0, mapped: 0, unmapped: 0, edited: 0, blockedRoutes: 0 }
  for (const card of cards) {
    let unmapped = 0
    for (const row of card.rows) {
      coverage.models += 1
      if (row.source === undefined) unmapped += 1
      else coverage.mapped += 1
      if (row.edited) coverage.edited += 1
    }
    coverage.unmapped += unmapped
    // An orphan is refused either way, and a refusal that still applies is one
    // the host would repeat; only the completeness gap is optional.
    const gap = requireCompleteMapping && unmapped > 0
    if (card.configured && (gap || card.orphans.length > 0 || card.errors.length > 0)) {
      coverage.blockedRoutes += 1
    }
  }
  return coverage
}

/** What one pass did to one route, as the host phrases it. */
export type PassOutcome = 'applied' | 'dry-run' | 'unchanged' | 'refused'

/** Read one host `formatOutcome` line back into its kind. */
export function outcomeOf(line: string): PassOutcome {
  if (line.includes(': refused')) return 'refused'
  if (line.includes(': would apply')) return 'dry-run'
  if (line.includes(': already complete')) return 'unchanged'
  return 'applied'
}

/** What the page should say after a save-and-fill. */
export interface PassSummary {
  kind: 'refused' | 'dry-run' | 'unchanged' | 'applied' | 'empty'
  /** The first route that was refused, when one was. */
  route?: string
}

/**
 * Summarise a pass the way a person would describe it.
 *
 * The page must not claim a fill that did not happen: a dry run writes nothing
 * and an already-complete route has nothing to write, so both are reported as
 * what they are rather than as "applied".
 *
 * @param lines - the host's outcome lines.
 */
export function summarizePass(lines: string[]): PassSummary {
  if (lines.length === 0) return { kind: 'empty' }
  const outcomes = lines.map((line) => ({ kind: outcomeOf(line), route: line.split(':')[0] ?? '' }))
  const refused = outcomes.find((entry) => entry.kind === 'refused')
  if (refused !== undefined) return { kind: 'refused', route: refused.route }
  if (outcomes.every((entry) => entry.kind === 'dry-run')) return { kind: 'dry-run' }
  if (outcomes.every((entry) => entry.kind === 'unchanged')) return { kind: 'unchanged' }
  return { kind: 'applied' }
}

/** Format a token budget the way the page shows it. */
export function formatTokens(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined
  if (value >= 1_000_000) return `${Math.round((value / 1_048_576) * 10) / 10}M`
  if (value >= 1000) return `${Math.round(value / 1000)}K`
  return String(value)
}

/** The one-line description of a candidate in the picker. */
export function describeCandidate(candidate: Candidate): string {
  const bits: string[] = [candidate.source]
  if (candidate.name !== undefined && candidate.name !== candidate.model) bits.push(candidate.name)
  const context = formatTokens(candidate.contextWindow)
  const output = formatTokens(candidate.maxTokens)
  if (context !== undefined) bits.push(`ctx ${context}`)
  if (output !== undefined) bits.push(`out ${output}`)
  if (candidate.effortLevels !== undefined) bits.push(candidate.effortLevels.join('/'))
  if (!candidate.usable && candidate.problem !== undefined) bits.push(`✗ ${candidate.problem}`)
  return bits.join(' · ')
}

/** One line per filled field, for the preview under a row. */
export function describeFilled(filled: Record<string, unknown>): string[] {
  return Object.entries(filled).map(([field, value]) => `${field}: ${summarizeValue(value)}`)
}

/** Render one filled value compactly. */
function summarizeValue(value: unknown): string {
  if (Array.isArray(value)) return value.join('+')
  if (value === null || typeof value !== 'object') return String(value)
  return Object.entries(value as Record<string, unknown>)
    .map(([key, inner]) => `${key}→${inner === null ? 'inherit' : String(inner)}`)
    .join(' ')
}

/** A timestamp as a short local string, or undefined. */
export function formatFetchedAt(fetchedAt: number | undefined): string | undefined {
  if (typeof fetchedAt !== 'number' || !Number.isFinite(fetchedAt)) return undefined
  try {
    return new Date(fetchedAt).toLocaleString()
  } catch {
    return undefined
  }
}

/** The copy key a state badge shows. */
export function stateKey(state: ModelRow['state']): StateKey {
  switch (state) {
    case 'filled':
      return 'stateFilled'
    case 'unchanged':
      return 'stateUnchanged'
    case 'invalid':
      return 'stateInvalid'
    case 'mapped':
      return 'stateMapped'
    default:
      return 'stateUnmapped'
  }
}

/** The copy keys a state badge can use. */
export type StateKey = 'stateFilled' | 'stateUnchanged' | 'stateInvalid' | 'stateMapped' | 'stateUnmapped'

/** The tone of a state badge, so the page colours it consistently. */
export function stateTone(state: ModelRow['state']): 'ok' | 'info' | 'warn' | 'bad' {
  switch (state) {
    case 'unchanged':
      return 'ok'
    case 'filled':
      return 'info'
    case 'invalid':
      return 'bad'
    case 'mapped':
      return 'ok'
    default:
      return 'warn'
  }
}
