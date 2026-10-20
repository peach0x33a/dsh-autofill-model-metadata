/**
 * The settings page, presentational half.
 *
 * This component is a pure function of its props: it holds no state, does no
 * fetching, and decides nothing about the config. Every action is a callback,
 * which is what lets it be rendered and asserted on in a Node test.
 *
 * The settings panel gives this page roughly 560 pixels of content width, where
 * a six-column table collapses into mid-word wraps. Each route is therefore one
 * card (route identity, counts and a per-route fill action in its header), and
 * each model is one row inside that card: the local model id and its models.dev
 * mapping share a single line, actions are icon buttons inside the mapping
 * field, and one short facts line underneath carries the declared-field count
 * and — only when a pass would write something — the fill preview. Rows are
 * separated by hairlines instead of nested boxes, so a route of four models
 * reads as one object rather than four floating cards.
 *
 * Spacing, type sizes, tag tones, buttons and inputs are copied from the shipped
 * `settings-models` page and the shared primitives, and every colour is a
 * `--dsw-alias-*` theme token, so light and dark themes are both the host's own.
 * Icons are inline SVG with the host's stroke weight. The styles are emitted as
 * one `<style>` element inside the page: the client bundle has no CSS pipeline,
 * and a component-rendered stylesheet is removed by React when the page
 * unmounts.
 *
 * @module dsh-autofill-model-metadata/client/view
 */

import type { ReactNode } from 'react'

import type { Candidate } from './api.ts'
import type { Translate } from './copy.ts'
import type { Coverage, ModelRow, RouteCard } from './model.ts'
import {
  candidateDetail,
  describeFilledFields,
  rowKey,
  stateKey,
  stateTone,
  summaryParts,
  summaryTone,
} from './model.ts'

/** The search state of one model row. */
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
  /** Apply the saved mapping for one route only. */
  onApplyRoute: (route: string) => void
  onToggleUnmappedOnly: () => void
  onEdit: (route: string, modelId: string, value: string) => void
  onSearch: (route: string, modelId: string, query: string) => void
  onCloseSearch: (route: string, modelId: string) => void
  onPick: (route: string, modelId: string, source: string) => void
  onClear: (route: string, modelId: string) => void
  onRemoveOrphan: (route: string, key: string) => void
  onSave: (apply: boolean) => void
}

/** A tag tone: the shared state colours plus a neutral one. */
type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'neutral'

/** Page styles: host tokens only, no literal colours. */
const PAGE_CSS = `
.dsh-af-page{display:flex;flex-direction:column;gap:14px;max-width:720px;min-width:0;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;box-sizing:border-box}
.dsh-af-head{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-af-title{margin:0;font-size:16px;font-weight:500;line-height:24px}
.dsh-af-intro{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh-af-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
.dsh-af-toolbarActions{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px}
.dsh-af-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm);border:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}
.dsh-af-btn:disabled{opacity:.4;cursor:not-allowed}
.dsh-af-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.dsh-af-btn[data-variant=secondary]{border:.5px solid var(--dsw-alias-border-l3);background:transparent}
.dsh-af-btn[data-variant=primary]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);font-size:14px;line-height:22px}
.dsh-af-btn[data-variant=ghost]{padding:0 8px;color:var(--dsw-alias-label-secondary)}
.dsh-af-btn[data-variant=icon]{flex:none;width:24px;height:24px;padding:0;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-tertiary)}
.dsh-af-btn[data-size=md]{height:36px;padding:0 14px;border-radius:var(--dsw-radius-md);font-size:14px;line-height:22px}
.dsh-af-btn[data-variant=ghost]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-af-btn[data-variant=icon]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-af-btn[data-variant=secondary]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-af-btn[data-variant=primary]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dsh-af-btn[data-loading=true] .dsh-af-icon{animation:dsh-af-spin .8s linear infinite}
@keyframes dsh-af-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.dsh-af-btn[data-loading=true] .dsh-af-icon{animation:none}}
.dsh-af-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center}
.dsh-af-check{display:inline-flex;align-items:center;gap:6px;margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}
.dsh-af-check input{flex:0 0 auto;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:inherit}
.dsh-af-check input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dsh-af-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary)}
.dsh-af-dot[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}
.dsh-af-dot[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}
.dsh-af-dot[data-tone=bad]{background:var(--dsw-alias-state-error-primary)}
.dsh-af-statusText{min-width:0;overflow-wrap:anywhere}
.dsh-af-statusCoverage{margin-left:auto;flex:none}
.dsh-af-tag{display:inline-flex;align-items:center;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;font-weight:500;white-space:nowrap}
.dsh-af-tag[data-tone=ok]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 10%,transparent);color:var(--dsw-alias-state-success-primary)}
.dsh-af-tag[data-tone=info]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);color:var(--dsw-alias-state-business-primary)}
.dsh-af-tag[data-tone=warn]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);color:var(--dsw-alias-state-warn-primary)}
.dsh-af-tag[data-tone=bad]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-af-tag[data-tone=neutral]{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}
.dsh-af-tagIcon{display:inline-flex;flex:none;align-items:center;justify-content:center;margin-right:4px}
.dsh-af-tagIcon svg{width:12px;height:12px}
.dsh-af-banner{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-af-banner[data-tone=bad]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-af-banner[data-tone=warn]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent);color:var(--dsw-alias-state-warn-label)}
.dsh-af-bannerTitle{font-weight:500}
.dsh-af-bannerHint{opacity:.8}
.dsh-af-groups{display:flex;flex-direction:column;gap:18px;min-width:0}
.dsh-af-group{display:flex;flex-direction:column;min-width:0}
.dsh-af-routeCard{min-width:0;overflow:hidden;border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill)}
.dsh-af-cardHead{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;padding:11px 14px}
.dsh-af-headIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-groupTitle{margin:0;font-size:14px;font-weight:500;line-height:22px;overflow-wrap:anywhere}
.dsh-af-groupRoute{flex:none;padding:1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11px;line-height:16px}
.dsh-af-groupCounts{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0}
.dsh-af-groupActions{margin-left:auto;display:inline-flex;align-items:center;gap:6px}
.dsh-af-reason{margin:0;padding:0 14px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-modelList{border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-model{display:flex;flex-direction:column;gap:6px;min-width:0;padding:10px 14px}
.dsh-af-model + .dsh-af-model{border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-modelLine{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-af-modelIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-modelId{flex:0 1 auto;min-width:0;max-width:44%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12.5px;font-weight:500;line-height:20px}
.dsh-af-mapArrow{display:inline-flex;flex:none;color:var(--dsw-alias-label-caption)}
.dsh-af-mapField{box-sizing:border-box;display:flex;align-items:center;gap:2px;flex:1 1 160px;min-width:120px;height:30px;padding:0 2px 0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.dsh-af-mapField:focus-within{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}
.dsh-af-mapInput{flex:1 1 auto;min-width:0;padding:0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:13px;line-height:20px}
.dsh-af-mapInput::placeholder{color:var(--dsw-alias-label-dimmed);font-family:var(--ds-font-family-text,inherit)}
.dsh-af-stateSlot{display:inline-flex;flex:none;align-items:center;gap:4px}
.dsh-af-facts{display:flex;flex-wrap:wrap;align-items:center;gap:3px 12px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-fact{display:inline-flex;align-items:center;gap:4px;min-width:0}
.dsh-af-factIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-caption)}
.dsh-af-factIcon[data-tone=info]{color:var(--dsw-alias-state-business-primary)}
.dsh-af-factLabel{white-space:nowrap}
.dsh-af-factValue{min-width:0;overflow-wrap:anywhere}
.dsh-af-chips{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;min-width:0}
.dsh-af-chip{display:inline-flex;align-items:baseline;gap:4px;max-width:100%;padding:1px 6px;border-radius:var(--dsw-radius-xs);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);font-size:11px;line-height:16px}
.dsh-af-chipKey{color:var(--dsw-alias-state-business-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);opacity:.8}
.dsh-af-chipValue{color:var(--dsw-alias-state-business-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);overflow-wrap:anywhere}
.dsh-af-rowError{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-search{display:flex;flex-direction:column;gap:6px;min-width:0;padding-top:8px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-searchHead{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-af-searchField{box-sizing:border-box;display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.dsh-af-searchField:focus-within{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}
.dsh-af-searchIcon{display:inline-flex;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-af-searchInput{flex:1 1 auto;min-width:0;padding:0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}
.dsh-af-searchInput::placeholder{color:var(--dsw-alias-label-dimmed)}
.dsh-af-candidates{display:flex;flex-direction:column;gap:1px;min-width:0;max-height:240px;overflow-y:auto;border-radius:var(--dsw-radius-md)}
.dsh-af-candidate{display:flex;flex-direction:column;gap:1px;width:100%;min-width:0;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsh-af-candidate:hover,.dsh-af-candidate:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-af-candidate:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-af-candidate[data-usable=false]{opacity:.7}
.dsh-af-candidateSource{min-width:0;color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsh-af-candidateMeta{min-width:0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dsh-af-searchNotice{padding:6px 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-extras{display:flex;flex-direction:column;gap:4px;min-width:0;padding:9px 14px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-extrasLine{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-orphan{display:inline-flex;align-items:center;gap:2px;padding:1px 2px 1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs)}
.dsh-af-orphanKey{color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11px;line-height:16px;overflow-wrap:anywhere}
.dsh-af-empty{margin:0;padding:24px 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;text-align:center}
.dsh-af-emptyInline{margin:0;padding:0 14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-footer{display:flex;flex-wrap:wrap;align-items:center;gap:12px;min-width:0;margin-top:4px;padding-top:12px;border-top:.5px solid var(--dsw-alias-border-l2)}
.dsh-af-footerInfo{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;flex:1 1 240px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-af-dirtyDot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
.dsh-af-dirtyDot[data-dirty=true]{background:var(--dsw-alias-state-warn-primary)}
.dsh-af-footerMessage{color:var(--dsw-alias-label-secondary)}
.dsh-af-footerHint{color:var(--dsw-alias-label-caption)}
.dsh-af-footerActions{display:inline-flex;align-items:center;gap:8px;margin-left:auto}
`

/** A small pill, optionally led by an icon. */
function Tag(props: { label: string; tone: Tone; icon?: ReactNode; title?: string }): ReactNode {
  return (
    <span className="dsh-af-tag" data-tone={props.tone} title={props.title}>
      {props.icon === undefined ? null : <span className="dsh-af-tagIcon">{props.icon}</span>}
      {props.label}
    </span>
  )
}

/** One inline SVG at the host's stroke weight. */
function Svg({ children }: { children: ReactNode }): ReactNode {
  return (
    <span className="dsh-af-icon" aria-hidden="true">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  )
}

/** A magnifier. */
function IconSearch(): ReactNode {
  return (
    <Svg>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.3 10.3 14 14" />
    </Svg>
  )
}

/** A cross, for clearing a mapping. */
function IconClear(): ReactNode {
  return (
    <Svg>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </Svg>
  )
}

/** A mapping arrow: local model id → models.dev record. */
function IconArrow(): ReactNode {
  return (
    <Svg>
      <path d="M3.2 8h9.2" />
      <path d="M9.4 4.9 12.5 8l-3.1 3.1" />
    </Svg>
  )
}

/** A model box. */
function IconModel(): ReactNode {
  return (
    <Svg>
      <path d="M8 2.4 13 5.1v5.8L8 13.6 3 10.9V5.1l5-2.7Z" />
      <path d="M3 5.1 8 7.8l5-2.7M8 7.8v5.8" />
    </Svg>
  )
}

/** Server rows, for a route. */
function IconServer(): ReactNode {
  return (
    <Svg>
      <rect x="3.2" y="3.2" width="9.6" height="4" rx="1" />
      <rect x="3.2" y="8.8" width="9.6" height="4" rx="1" />
      <path d="M5.5 5.2h.01M5.5 10.8h.01" />
    </Svg>
  )
}

/** A lightning bolt, for a fill action. */
function IconBolt(): ReactNode {
  return (
    <Svg>
      <path d="M9 2.2 4.6 8.6h2.8L6.9 13.8l4.5-6.6H8.6L9 2.2Z" />
    </Svg>
  )
}

/** A list with a check, for the catalog inspection action. */
function IconChecklist(): ReactNode {
  return (
    <Svg>
      <path d="M2.8 4.4h5.6M2.8 8h5.6M2.8 11.6h3.4" />
      <path d="M10.6 10.7 12 12.1l2-2.6" />
    </Svg>
  )
}

/** A circular arrow, for reloading. */
function IconRefresh(): ReactNode {
  return (
    <Svg>
      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
      <path d="M13 2.9v3.4H9.6" />
    </Svg>
  )
}

/** A padlock, for hand-declared (protected) fields. */
function IconLock(): ReactNode {
  return (
    <Svg>
      <rect x="4.3" y="7" width="7.4" height="6" rx="1.2" />
      <path d="M6 7V5.4a2 2 0 0 1 4 0V7" />
    </Svg>
  )
}

/** A sparkle, for fields a pass would fill. */
function IconSparkle(): ReactNode {
  return (
    <Svg>
      <path d="M8 2.4l1.3 3.5 3.5 1.3-3.5 1.3L8 12 6.7 8.5 3.2 7.2l3.5-1.3L8 2.4Z" />
    </Svg>
  )
}

/** A check, for saving. */
function IconCheck(): ReactNode {
  return (
    <Svg>
      <path d="M3.4 8.4 6.2 11.2 12.6 4.8" />
    </Svg>
  )
}

/** A native button styled like the host's small and medium buttons. */
function Button(props: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  /** Accessible name and hover tooltip; required for icon-only buttons. */
  label?: string
  onClick?: () => void
  children: ReactNode
}): ReactNode {
  return (
    <button
      type="button"
      className="dsh-af-btn"
      data-variant={props.variant ?? 'secondary'}
      data-size={props.size ?? 'sm'}
      data-loading={props.loading}
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

/** One model: identity and mapping on one line, facts underneath. */
function ModelRow(props: {
  row: ModelRow
  t: Translate
  search?: SearchState
  onEdit: ViewProps['onEdit']
  onSearch: ViewProps['onSearch']
  onCloseSearch: ViewProps['onCloseSearch']
  onPick: ViewProps['onPick']
  onClear: ViewProps['onClear']
}): ReactNode {
  const { row, t, search } = props
  const filled = describeFilledFields(row.filled)
  const declared = row.declared.length
  // The route header already counts complete models, so a complete row only
  // repeats the same pill. Show a state pill per row when it is news — a gap,
  // a pending fill, an invalid source, an unsaved edit — and leave complete
  // rows quiet.
  const rowTag = row.state !== 'unchanged' || row.edited
  return (
    <div className="dsh-af-model">
      <div className="dsh-af-modelLine">
        <span className="dsh-af-modelIcon" aria-hidden="true">
          <IconModel />
        </span>
        <span className="dsh-af-modelId" title={row.modelId}>
          {row.modelId}
        </span>
        <span className="dsh-af-mapArrow" aria-hidden="true">
          <IconArrow />
        </span>
        <div className="dsh-af-mapField">
          <input
            className="dsh-af-mapInput"
            value={row.source ?? ''}
            placeholder="provider/model"
            aria-label={`${row.modelId} ${t('source')}`}
            spellCheck={false}
            onChange={(event) => props.onEdit(row.route, row.modelId, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') props.onSearch(row.route, row.modelId, row.source ?? row.modelId)
            }}
          />
          <Button
            variant="icon"
            label={search?.loading === true ? t('searching') : t('search')}
            loading={search?.loading === true}
            onClick={() => props.onSearch(row.route, row.modelId, row.source ?? row.modelId)}
          >
            <IconSearch />
          </Button>
          {row.source === undefined ? null : (
            <Button
              variant="icon"
              label={t('clear')}
              onClick={() => props.onClear(row.route, row.modelId)}
            >
              <IconClear />
            </Button>
          )}
        </div>
        {rowTag ? (
          <span className="dsh-af-stateSlot">
            {row.state === 'unchanged' ? null : (
              <Tag label={t(stateKey(row.state), { count: 1 })} tone={stateTone(row.state)} />
            )}
            {row.edited ? <Tag label={t('dirtyTag')} tone="warn" /> : null}
          </span>
        ) : null}
      </div>

      <div className="dsh-af-facts">
        <span
          className="dsh-af-fact"
          title={declared === 0 ? t('nothingDeclared') : `${t('declared')}: ${row.declared.join(' · ')}`}
        >
          <span className="dsh-af-factIcon" aria-hidden="true">
            <IconLock />
          </span>
          <span className="dsh-af-factValue">
            {declared === 0 ? t('nothingDeclared') : t('declaredCount', { count: declared })}
          </span>
        </span>
        {filled.length === 0 ? null : (
          <span className="dsh-af-fact">
            <span className="dsh-af-factIcon" data-tone="info" aria-hidden="true">
              <IconSparkle />
            </span>
            <span className="dsh-af-factLabel">{t('willFill')}</span>
            <span className="dsh-af-chips">
              {filled.map(({ field, value }) => (
                <span key={field} className="dsh-af-chip">
                  <span className="dsh-af-chipKey">{field}</span>
                  <span className="dsh-af-chipValue">{value}</span>
                </span>
              ))}
            </span>
          </span>
        )}
      </div>

      {row.error === undefined ? null : (
        <div className="dsh-af-rowError">
          {row.error.kind}: {row.error.message}
        </div>
      )}

      {search?.open !== true ? null : (
        <div className="dsh-af-search">
          <div className="dsh-af-searchHead">
            <div className="dsh-af-searchField">
              <span className="dsh-af-searchIcon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                className="dsh-af-searchInput"
                value={search.query}
                placeholder={t('searchHint')}
                aria-label={`${row.modelId} ${t('search')}`}
                spellCheck={false}
                autoFocus
                onChange={(event) => props.onSearch(row.route, row.modelId, event.target.value)}
              />
            </div>
            <Button variant="ghost" onClick={() => props.onCloseSearch(row.route, row.modelId)}>
              {t('cancel')}
            </Button>
          </div>
          <div className="dsh-af-candidates">
            {search.error === undefined ? null : <div className="dsh-af-searchNotice">{search.error}</div>}
            {search.loading ? <div className="dsh-af-searchNotice">{t('searching')}</div> : null}
            {!search.loading && search.error === undefined && search.candidates.length === 0 ? (
              <div className="dsh-af-searchNotice">{t('noCandidates')}</div>
            ) : null}
            {search.candidates.map((candidate) => {
              const detail = candidateDetail(candidate)
              return (
                <button
                  key={candidate.source}
                  type="button"
                  className="dsh-af-candidate"
                  data-usable={candidate.usable}
                  title={
                    candidate.usable
                      ? candidate.source
                      : `${candidate.source} — ${candidate.problem ?? t('unusable')}`
                  }
                  onClick={() => props.onPick(row.route, row.modelId, candidate.source)}
                >
                  <span className="dsh-af-candidateSource">{candidate.source}</span>
                  {detail.length === 0 ? null : <span className="dsh-af-candidateMeta">{detail}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** One route: its card header, its model rows, and its refusals. */
function RouteSection(props: {
  card: RouteCard
  t: Translate
  searches: Record<string, SearchState>
  unmappedOnly: boolean
  saving: boolean
  dirty: boolean
  actions: Pick<
    ViewProps,
    | 'onEdit'
    | 'onSearch'
    | 'onCloseSearch'
    | 'onPick'
    | 'onClear'
    | 'onRemoveOrphan'
    | 'onApplyRoute'
  >
}): ReactNode {
  const { card, t } = props
  const rows = props.unmappedOnly ? card.rows.filter((row) => row.source === undefined) : card.rows
  // With the filter on, a route that has no gap is not news.
  if (props.unmappedOnly && rows.length === 0) return null
  // A route where every model is already complete does not need the word
  // "complete" repeated in a pill; a check and the model count say it once.
  const allComplete = card.counts.models > 0 && card.counts.unchanged === card.counts.models
  return (
    <section className="dsh-af-group" aria-label={card.displayName}>
      <div className="dsh-af-routeCard">
        <header className="dsh-af-cardHead">
          <span className="dsh-af-headIcon" aria-hidden="true">
            <IconServer />
          </span>
          <h3 className="dsh-af-groupTitle">{card.displayName}</h3>
          {card.displayName === card.route ? null : <span className="dsh-af-groupRoute">{card.route}</span>}
          <span className="dsh-af-groupCounts">
            {allComplete ? (
              <Tag
                label={t('summaryModels', { count: card.counts.models })}
                tone="ok"
                icon={<IconCheck />}
                title={t('summaryUnchanged', { count: card.counts.unchanged })}
              />
            ) : (
              summaryParts(card.counts).map((part) => (
                <Tag key={part.key} label={t(part.key, { count: part.count })} tone={summaryTone(part.key)} />
              ))
            )}
          </span>
          {card.writable && !props.dirty && card.rows.some((row) => row.state === 'filled') ? (
            <span className="dsh-af-groupActions">
              <Button variant="ghost" disabled={props.saving} onClick={() => props.actions.onApplyRoute(card.route)}>
                <IconBolt />
                {t('fillRoute')}
              </Button>
            </span>
          ) : null}
        </header>

        {card.reason === undefined ? null : <p className="dsh-af-reason">{card.reason}</p>}

        {rows.length === 0 ? (
          <p className="dsh-af-emptyInline">{t('noModels')}</p>
        ) : (
          <div className="dsh-af-modelList">
            {rows.map((row) => (
              <ModelRow
                key={rowKey(row.route, row.modelId)}
                row={row}
                t={t}
                search={props.searches[rowKey(row.route, row.modelId)]}
                onEdit={props.actions.onEdit}
                onSearch={props.actions.onSearch}
                onCloseSearch={props.actions.onCloseSearch}
                onPick={props.actions.onPick}
                onClear={props.actions.onClear}
              />
            ))}
          </div>
        )}

        {card.orphans.length === 0 ? null : (
          <div className="dsh-af-extras">
            <div className="dsh-af-extrasLine">
              <span>{t('orphans')}</span>
              {card.orphans.map((orphan) => (
                <span key={orphan} className="dsh-af-orphan">
                  <span className="dsh-af-orphanKey">{orphan}</span>
                  <Button variant="ghost" onClick={() => props.actions.onRemoveOrphan(card.route, orphan)}>
                    {t('remove')}
                  </Button>
                </span>
              ))}
            </div>
          </div>
        )}

        {card.errors.length === 0 ? null : (
          <div className="dsh-af-extras">
            {card.errors.map((error, index) => (
              <div key={`${error.kind}-${index}`} className="dsh-af-rowError">
                {error.kind}: {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/** The whole page. */
export function MetadataView(props: ViewProps): ReactNode {
  const { t, info, coverage } = props
  const catalogBits: string[] = []
  if (info.catalogProviderCount !== undefined) {
    catalogBits.push(t('catalogProviders', { count: info.catalogProviderCount }))
    catalogBits.push(info.stale ? t('catalogStale') : info.fromCache ? t('catalogCached') : t('catalogFresh'))
  }
  const catalogText =
    catalogBits.length === 0 ? t('catalog') : `${t('catalog')} · ${catalogBits.join(' · ')}`
  const catalogTone: 'ok' | 'warn' | 'bad' | 'idle' =
    info.catalogError !== undefined ? 'bad' : info.stale ? 'warn' : info.resolved ? 'ok' : 'idle'
  const coverageText = t('coverage', {
    mapped: coverage.mapped,
    models: coverage.models,
    unmapped: coverage.unmapped,
  })
  const coverageTone: Tone = !info.resolved
    ? 'neutral'
    : coverage.unmapped > 0 || coverage.blockedRoutes > 0
      ? 'warn'
      : 'ok'

  return (
    <div className="dsh-af-page">
      <style>{PAGE_CSS}</style>

      <header className="dsh-af-head">
        <h2 className="dsh-af-title">{t('title')}</h2>
        <p className="dsh-af-intro">{t('intro')}</p>
      </header>

      <div className="dsh-af-toolbar">
        <div className="dsh-af-toolbarActions">
          <Button variant="secondary" onClick={props.onReload} disabled={props.loading}>
            <IconRefresh />
            {t('reload')}
          </Button>
          <Button variant="secondary" onClick={props.onInspect} disabled={props.loading || props.saving}>
            <IconChecklist />
            {t('inspect')}
          </Button>
          <Button
            variant="secondary"
            onClick={props.onApplyAll}
            disabled={props.loading || props.saving || props.dirty}
          >
            <IconBolt />
            {t('applyAll')}
          </Button>
        </div>
        <label className="dsh-af-check">
          <input type="checkbox" checked={props.unmappedOnly} onChange={props.onToggleUnmappedOnly} />
          {t('unmappedOnly')}
        </label>
      </div>

      <div className="dsh-af-status">
        <span className="dsh-af-dot" data-tone={catalogTone} aria-hidden="true" />
        <span className="dsh-af-statusText">
          {catalogText}
          {info.fetchedAt === undefined ? null : ` · ${t('catalogFetchedAt', { when: info.fetchedAt })}`}
        </span>
        <span className="dsh-af-statusCoverage">
          <Tag label={coverageText} tone={coverageTone} />
        </span>
      </div>

      {props.error === undefined ? null : (
        <div className="dsh-af-banner" data-tone="bad" role="alert">
          <span className="dsh-af-bannerTitle">{t('failed', { reason: props.error })}</span>
          <span className="dsh-af-bannerHint">{t('builtinFormKept')}</span>
        </div>
      )}

      {info.resolved ? null : (
        <div className="dsh-af-banner" role="status">
          <span>
            {info.catalogError === undefined
              ? t('loading')
              : t('catalogUnavailable', { reason: info.catalogError })}
          </span>
          <span className="dsh-af-bannerHint">{t('catalogUnavailableHint')}</span>
        </div>
      )}

      {info.dryRun ? (
        <div className="dsh-af-banner" data-tone="warn" role="status">
          {t('dryRun')}
        </div>
      ) : null}

      {coverage.blockedRoutes > 0 ? (
        <div className="dsh-af-banner" data-tone="warn" role="status">
          {t('blocked', { routes: coverage.blockedRoutes })}
        </div>
      ) : null}

      {props.loading && props.cards.length === 0 ? <p className="dsh-af-empty">{t('loading')}</p> : null}
      {!props.loading && props.cards.length === 0 ? <p className="dsh-af-empty">{t('noRoutes')}</p> : null}

      <div className="dsh-af-groups">
        {props.cards.map((card) => (
          <RouteSection
            key={card.route}
            card={card}
            t={t}
            searches={props.searches}
            unmappedOnly={props.unmappedOnly}
            saving={props.saving}
            dirty={props.dirty}
            actions={props}
          />
        ))}
      </div>

      <footer className="dsh-af-footer">
        <div className="dsh-af-footerInfo">
          <span className="dsh-af-dirtyDot" data-dirty={props.dirty} aria-hidden="true" />
          <span>{props.dirty ? t('dirty') : t('clean')}</span>
          {props.message === undefined ? null : (
            <span className="dsh-af-footerMessage" role="status">
              {props.message}
            </span>
          )}
          <span className="dsh-af-footerHint">{t('neverOverwrites')}</span>
        </div>
        <div className="dsh-af-footerActions">
          <Button
            size="md"
            variant="secondary"
            onClick={() => props.onSave(false)}
            disabled={props.saving || !props.dirty}
          >
            <IconCheck />
            {props.saving ? t('saving') : t('save')}
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={() => props.onSave(true)}
            disabled={props.saving || coverage.blockedRoutes > 0}
          >
            <IconBolt />
            {t('saveApply')}
          </Button>
        </div>
      </footer>
    </div>
  )
}
