/**
 * The settings page, presentational half.
 *
 * This component is a pure function of its props: it holds no state, does no
 * fetching, and decides nothing about the config. Every action is a callback,
 * which is what lets it be rendered and asserted on in a Node test.
 *
 * @module dsh-autofill-model-metadata/client/view
 */

import type { ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'

import type { Candidate } from './api.ts'
import type { Translate } from './copy.ts'
import type { Coverage, ModelRow, RouteCard } from './model.ts'
import { describeCandidate, describeFilled, rowKey, stateKey, stateTone, summaryParts } from './model.ts'

/** The search state of one row of the table. */
export interface SearchState {
  query: string
  open: boolean
  loading: boolean
  candidates: Candidate[]
  error?: string
}

/** What the header knows about the catalog and the environment. */
export interface PageInfo {
  resolved: boolean
  catalogProviderCount?: number
  stale?: boolean
  fromCache?: boolean
  fetchedAt?: string
  catalogError?: string
  dryRun: boolean
  /** True while the host still offers its own settings form as well. */
  builtinFormKept: boolean
}

/** Everything the page renders, and every way it can be driven. */
export interface ViewProps {
  t: Translate
  loading: boolean
  /** A whole-page failure: the page cannot reach its own host endpoints. */
  error?: string
  info: PageInfo
  cards: RouteCard[]
  coverage: Coverage
  dirty: boolean
  saving: boolean
  message?: string
  unmappedOnly: boolean
  searches: Record<string, SearchState>
  onReload: () => void
  onInspect: () => void
  onApplyAll: () => void
  onToggleUnmappedOnly: () => void
  onEdit: (route: string, modelId: string, value: string) => void
  onSearch: (route: string, modelId: string, query: string) => void
  onPick: (route: string, modelId: string, source: string) => void
  onClear: (route: string, modelId: string) => void
  onRemoveOrphan: (route: string, key: string) => void
  onSave: (apply: boolean) => void
}

/** Layout constants, so the page looks deliberate rather than unstyled. */
const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '4px 2px 8px',
    color: 'inherit',
    // The settings pane is a fixed-width column: anything wider must scroll
    // inside its own card rather than clip the page.
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 600 },
  intro: { margin: '2px 0 0', fontSize: 12, opacity: 0.7, lineHeight: 1.5 },
  bar: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  meta: { fontSize: 12, opacity: 0.75 },
  card: {
    border: '1px solid rgba(128,128,128,0.28)',
    borderRadius: 10,
    padding: '10px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  cardHead: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 13, fontWeight: 600 },
  dim: { fontSize: 12, opacity: 0.7 },
  tableWrap: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    // Fixed layout + percentage columns: a long model id or mapping source wraps
    // inside its cell instead of pushing the table past the pane.
    tableLayout: 'fixed' as const,
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    fontWeight: 500,
    opacity: 0.6,
    padding: '4px 8px 4px 0',
    borderBottom: '1px solid rgba(128,128,128,0.22)',
    overflowWrap: 'anywhere' as const,
  },
  td: {
    padding: '6px 8px 6px 0',
    verticalAlign: 'top' as const,
    overflowWrap: 'anywhere' as const,
    minWidth: 0,
  },
  input: {
    font: 'inherit',
    fontSize: 12,
    color: 'inherit',
    background: 'transparent',
    border: '1px solid rgba(128,128,128,0.4)',
    borderRadius: 6,
    padding: '3px 6px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  candidates: {
    marginTop: 4,
    border: '1px solid rgba(128,128,128,0.28)',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'auto',
    background: 'rgba(128,128,128,0.06)',
  },
  candidate: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontSize: 12,
    padding: '5px 8px',
    cursor: 'pointer',
  },
  banner: {
    border: '1px solid rgba(128,128,128,0.3)',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    lineHeight: 1.5,
    background: 'rgba(128,128,128,0.08)',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    alignItems: 'center',
    borderTop: '1px solid rgba(128,128,128,0.22)',
    paddingTop: 10,
  },
  mono: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5 },
  fields: { display: 'flex', flexWrap: 'wrap' as const, gap: '0 6px', opacity: 0.7 },
  pick: {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 11,
    textDecoration: 'underline',
    padding: 0,
  },
} as const

/** The colour of a state badge. */
function toneStyle(tone: ReturnType<typeof stateTone>): { background: string; color?: string } {
  switch (tone) {
    case 'ok':
      return { background: 'rgba(48,164,108,0.18)' }
    case 'info':
      return { background: 'rgba(64,120,216,0.18)' }
    case 'bad':
      return { background: 'rgba(216,72,72,0.18)' }
    default:
      return { background: 'rgba(200,140,40,0.20)' }
  }
}

/** A small pill. */
function Badge({ text, tone }: { text: string; tone: ReturnType<typeof stateTone> }): ReactNode {
  return (
    <span
      style={{
        ...toneStyle(tone),
        borderRadius: 999,
        padding: '1px 8px',
        fontSize: 11,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

/** One row: the mapping editor for a single declared model. */
function Row(props: {
  row: ModelRow
  t: Translate
  search?: SearchState
  onEdit: ViewProps['onEdit']
  onSearch: ViewProps['onSearch']
  onPick: ViewProps['onPick']
  onClear: ViewProps['onClear']
}): ReactNode {
  const { row, t, search } = props
  const key = rowKey(row.route, row.modelId)
  const filled = describeFilled(row.filled)
  return (
    <>
      <tr>
        <td style={{ ...S.td, ...S.mono }}>{row.modelId}</td>
        <td style={S.td}>
          {row.declared.length === 0 ? (
            <span style={S.dim}>{t('nothingDeclared')}</span>
          ) : (
            <span style={S.fields}>
              {row.declared.map((field) => (
                <span key={field}>{field}</span>
              ))}
            </span>
          )}
        </td>
        <td style={{ ...S.td, minWidth: 190 }}>
          <input
            style={S.input}
            value={row.source ?? ''}
            placeholder="provider/model"
            aria-label={`${row.modelId} ${t('source')}`}
            onChange={(event) => props.onEdit(row.route, row.modelId, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') props.onSearch(row.route, row.modelId, row.source ?? row.modelId)
            }}
          />
        </td>
        <td style={S.td}>
          <Badge text={t(stateKey(row.state), { count: 1 })} tone={stateTone(row.state)} />
          {row.edited ? <span style={{ ...S.dim, marginLeft: 6 }}>{t('dirty')}</span> : null}
        </td>
        <td style={S.td}>
          {filled.length === 0 ? (
            <span style={S.dim}>—</span>
          ) : (
            <div style={S.dim}>
              {filled.map((line) => (
                <div key={line} style={S.mono}>
                  {line}
                </div>
              ))}
            </div>
          )}
          {row.error === undefined ? null : (
            <div style={{ ...S.dim, color: 'rgb(200,80,80)' }}>
              {row.error.kind}: {row.error.message}
            </div>
          )}
        </td>
        <td style={S.td}>
          <button type="button" style={S.pick} onClick={() => props.onSearch(row.route, row.modelId, row.source ?? row.modelId)}>
            {search?.loading === true ? t('searching') : t('search')}
          </button>
          {row.source === undefined ? null : (
            <div>
              <button type="button" style={S.pick} onClick={() => props.onClear(row.route, row.modelId)}>
                {t('clear')}
              </button>
            </div>
          )}
        </td>
      </tr>
      {search?.open !== true ? null : (
        <tr key={`${key}-search`}>
          <td style={S.td} />
          <td style={S.td} colSpan={5}>
            <input
              style={{ ...S.input, maxWidth: 420 }}
              value={search.query}
              placeholder={t('searchHint')}
              aria-label={`${row.modelId} ${t('search')}`}
              onChange={(event) => props.onSearch(row.route, row.modelId, event.target.value)}
              autoFocus
            />
            <div style={S.candidates}>
              {search.error === undefined ? null : <div style={{ ...S.dim, padding: '6px 8px' }}>{search.error}</div>}
              {search.loading ? <div style={{ ...S.dim, padding: '6px 8px' }}>{t('searching')}</div> : null}
              {!search.loading && search.error === undefined && search.candidates.length === 0 ? (
                <div style={{ ...S.dim, padding: '6px 8px' }}>{t('noCandidates')}</div>
              ) : null}
              {search.candidates.map((candidate) => (
                <button
                  key={candidate.source}
                  type="button"
                  style={S.candidate}
                  title={candidate.usable ? candidate.source : `${candidate.source} — ${candidate.problem ?? t('unusable')}`}
                  onClick={() => props.onPick(row.route, row.modelId, candidate.source)}
                >
                  {describeCandidate(candidate)}
                </button>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/** One route card. */
function Card(props: {
  card: RouteCard
  t: Translate
  searches: Record<string, SearchState>
  unmappedOnly: boolean
  actions: Pick<ViewProps, 'onEdit' | 'onSearch' | 'onPick' | 'onClear' | 'onRemoveOrphan'>
}): ReactNode {
  const { card, t } = props
  const rows = props.unmappedOnly ? card.rows.filter((row) => row.source === undefined) : card.rows
  if (props.unmappedOnly && rows.length === 0) return null
  return (
    <section style={S.card}>
      <div style={S.cardHead}>
        <span style={S.cardTitle}>{card.displayName}</span>
        {card.displayName === card.route ? null : <span style={{ ...S.dim, ...S.mono }}>{card.route}</span>}
        <span style={S.dim}>
          {summaryParts(card.counts)
            .map((part) => t(part.key, { count: part.count }))
            .join(' · ')}
        </span>
        {card.writable ? <Badge text={t('applyAll')} tone="info" /> : null}
      </div>
      {card.reason === undefined ? null : <div style={S.dim}>{card.reason}</div>}
      {rows.length === 0 ? (
        <div style={S.dim}>{t('noModels')}</div>
      ) : (
        <div style={S.tableWrap}>
        <table style={S.table}>
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={S.th}>{t('model')}</th>
              <th style={S.th}>{t('declared')}</th>
              <th style={S.th}>{t('source')}</th>
              <th style={S.th}>{t('state')}</th>
              <th style={S.th}>{t('preview')}</th>
              <th style={S.th}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={rowKey(row.route, row.modelId)}
                row={row}
                t={t}
                search={props.searches[rowKey(row.route, row.modelId)]}
                onEdit={props.actions.onEdit}
                onSearch={props.actions.onSearch}
                onPick={props.actions.onPick}
                onClear={props.actions.onClear}
              />
            ))}
          </tbody>
        </table>
        </div>
      )}
      {card.orphans.length === 0 ? null : (
        <div style={S.dim}>
          {t('orphans')}:{' '}
          {card.orphans.map((orphan) => (
            <span key={orphan} style={{ marginRight: 8 }}>
              <span style={S.mono}>{orphan}</span>{' '}
              <button type="button" style={S.pick} onClick={() => props.actions.onRemoveOrphan(card.route, orphan)}>
                {t('remove')}
              </button>
            </span>
          ))}
        </div>
      )}
      {card.errors.length === 0 ? null : (
        <div style={S.dim}>
          {card.errors.map((error, index) => (
            <div key={`${error.kind}-${index}`} style={{ color: 'rgb(200,80,80)' }}>
              {error.kind}: {error.message}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** The whole page. */
export function MetadataView(props: ViewProps): ReactNode {
  const { t, info, coverage } = props
  return (
    <div style={S.root}>
      <header>
        <h2 style={S.h2}>{t('title')}</h2>
        <p style={S.intro}>{t('intro')}</p>
      </header>

      <div style={S.bar}>
        <Button variant="outline" size="sm" onClick={props.onReload} disabled={props.loading}>
          {t('reload')}
        </Button>
        <Button variant="outline" size="sm" onClick={props.onInspect} disabled={props.loading || props.saving}>
          {t('inspect')}
        </Button>
        <Button variant="outline" size="sm" onClick={props.onApplyAll} disabled={props.loading || props.saving || props.dirty}>
          {t('applyAll')}
        </Button>
        <label style={{ ...S.meta, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={props.unmappedOnly} onChange={props.onToggleUnmappedOnly} />
          {t('unmappedOnly')}
        </label>
      </div>

      <div style={S.meta}>
        {t('catalog')}:{' '}
        {info.catalogProviderCount === undefined
          ? '—'
          : [
              t('catalogProviders', { count: info.catalogProviderCount }),
              info.stale ? t('catalogStale') : info.fromCache ? t('catalogCached') : t('catalogFresh'),
              info.fetchedAt === undefined ? undefined : t('catalogFetchedAt', { when: info.fetchedAt }),
            ]
              .filter((part): part is string => part !== undefined)
              .join(' · ')}
        {' · '}
        {t('coverage', { mapped: coverage.mapped, models: coverage.models, unmapped: coverage.unmapped })}
        {info.dryRun ? ` · ${t('dryRun')}` : ''}
      </div>

      {props.error === undefined ? null : (
        <div style={S.banner} role="alert">
          <strong>{t('failed', { reason: props.error })}</strong>
          <div style={{ marginTop: 4 }}>{t('builtinFormKept')}</div>
        </div>
      )}

      {info.resolved ? null : (
        <div style={S.banner} role="status">
          <div>{info.catalogError === undefined ? t('loading') : t('catalogUnavailable', { reason: info.catalogError })}</div>
          <div style={{ marginTop: 4, opacity: 0.75 }}>{t('catalogUnavailableHint')}</div>
        </div>
      )}

      {coverage.blockedRoutes > 0 ? (
        <div style={S.banner} role="status">
          {t('blocked', { routes: coverage.blockedRoutes })}
        </div>
      ) : null}

      {props.loading && props.cards.length === 0 ? <div style={S.dim}>{t('loading')}</div> : null}
      {!props.loading && props.cards.length === 0 ? <div style={S.dim}>{t('noRoutes')}</div> : null}

      {props.cards.map((card) => (
        <Card
          key={card.route}
          card={card}
          t={t}
          searches={props.searches}
          unmappedOnly={props.unmappedOnly}
          actions={props}
        />
      ))}

      <footer style={S.footer}>
        <Button variant="outline" size="sm" onClick={() => props.onSave(false)} disabled={props.saving || !props.dirty}>
          {props.saving ? t('saving') : t('save')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => props.onSave(true)} disabled={props.saving || coverage.blockedRoutes > 0}>
          {t('saveApply')}
        </Button>
        <span style={S.meta}>{props.dirty ? t('dirty') : t('clean')}</span>
        {props.message === undefined ? null : (
          <span style={S.meta} role="status">
            {props.message}
          </span>
        )}
        <span style={{ ...S.meta, marginLeft: 'auto' }}>{t('neverOverwrites')}</span>
      </footer>
    </div>
  )
}
