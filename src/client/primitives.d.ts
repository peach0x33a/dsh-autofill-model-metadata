/**
 * Types for the shared UI kit.
 *
 * `@deepseek-ai/dsh-client-ui-primitives` ships from the Web shell's static
 * module seed and publishes no `.d.ts` of its own, so the browser half declares
 * the small surface it uses. The signatures are the ones the shipped client
 * bundles are compiled against — they `require` this module and pass exactly
 * these props.
 *
 * The declaration must stay in an ambient (import-free) file: a module file with
 * a top-level import would turn this into an augmentation of a module that does
 * not exist in `node_modules`.
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { CSSProperties, ReactNode } from 'react'

  /** The props the shipped call sites pass to `Button`. */
  export interface ButtonProps {
    variant?: 'solid' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    disabled?: boolean
    title?: string
    style?: CSSProperties
    type?: 'button' | 'submit' | 'reset'
    onClick?: (event?: unknown) => void
    children?: ReactNode
  }

  /** The kit's button. */
  export function Button(props: ButtonProps): ReactNode
}
