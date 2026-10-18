/**
 * Test stand-in for the shared UI kit.
 *
 * The real `@deepseek-ai/dsh-client-ui-primitives` only exists inside the DSH
 * Web shell, where the module loader seeds it. Vitest aliases the specifier to
 * this file so the page's views can be rendered and asserted on in Node: the
 * stub keeps the props contract and renders a plain `<button>`.
 */
import type { ReactNode } from 'react'

export interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  title?: string
  onClick?: (event?: unknown) => void
  children?: ReactNode
}

/** A button that renders its children and forwards clicks. */
export function Button(props: ButtonProps): ReactNode {
  return (
    <button type="button" disabled={props.disabled} title={props.title} onClick={() => props.onClick?.()}>
      {props.children}
    </button>
  )
}
