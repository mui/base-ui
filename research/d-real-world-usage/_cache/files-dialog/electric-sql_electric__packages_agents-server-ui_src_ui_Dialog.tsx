import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import styles from './Dialog.module.css'

interface RootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean | `trap-focus`
  children?: ReactNode
}

interface ContentProps {
  /** Pixel max-width — replaces Radix's `maxWidth="…"` prop. */
  maxWidth?: number | string
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /** Whether to render the modal backdrop. Default true. */
  withBackdrop?: boolean
  /**
   * Render the popup outside the trigger's React tree (default true).
   * Disable only if you need the popup inside a specific stacking context.
   */
  inPortal?: boolean
}

/**
 * Modal dialog — wraps `@base-ui/react/dialog`.
 *
 * Replaces `Dialog.Root / Dialog.Content / Dialog.Title / Dialog.Description /
 * Dialog.Close` from `@radix-ui/themes` with the same shape:
 *
 *   <Dialog.Root open={open} onOpenChange={setOpen}>
 *     <Dialog.Content maxWidth={520}>
 *       <Dialog.Title>Edit profile</Dialog.Title>
 *       <Dialog.Description>...</Dialog.Description>
 *       <Dialog.Close>Cancel</Dialog.Close>
 *     </Dialog.Content>
 *   </Dialog.Root>
 *
 * Note: Base UI's <Dialog.Trigger> can be used instead of controlling
 * `open` from state. Re-exported as `Dialog.Trigger`.
 */
function Root({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  children,
}: RootProps): React.ReactElement {
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </BaseDialog.Root>
  )
}

function Content({
  maxWidth,
  className,
  style,
  children,
  withBackdrop = true,
  inPortal = true,
}: ContentProps): React.ReactElement {
  const popupStyle: CSSProperties = maxWidth
    ? { maxWidth, ...style }
    : (style ?? {})
  const popup = (
    <>
      {withBackdrop && <BaseDialog.Backdrop className={styles.backdrop} />}
      <BaseDialog.Popup
        className={[styles.popup, className].filter(Boolean).join(` `)}
        style={popupStyle}
      >
        {children}
      </BaseDialog.Popup>
    </>
  )
  return inPortal ? <BaseDialog.Portal>{popup}</BaseDialog.Portal> : popup
}

function Title({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <BaseDialog.Title
      className={[styles.title, className].filter(Boolean).join(` `)}
    >
      {children}
    </BaseDialog.Title>
  )
}

function Description({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <BaseDialog.Description
      className={[styles.description, className].filter(Boolean).join(` `)}
    >
      {children}
    </BaseDialog.Description>
  )
}

/**
 * Standard dialog header — title/description on the left, an X close
 * button on the right. Pair with `Dialog.Title` + `Dialog.Description`
 * as children. Replaces the ad-hoc flex row that consumers were
 * hand-rolling around `Dialog.Title` + an IconButton-Close.
 */
function Header({
  children,
  closeAriaLabel = `Close dialog`,
}: {
  children: ReactNode
  closeAriaLabel?: string
}): React.ReactElement {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>{children}</div>
      <CloseButton ariaLabel={closeAriaLabel} />
    </div>
  )
}

/** Scrollable body — vertical Stack-like layout with the standard gap. */
function Body({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <div className={[styles.body, className].filter(Boolean).join(` `)}>
      {children}
    </div>
  )
}

/**
 * Footer for actions — right-aligned row. Wrap cancel + submit buttons.
 * The cancel button is typically a `Dialog.Close` render-prop wrapping
 * a `Button` so it dismisses without consumer wiring.
 */
function Footer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(` `)}>
      {children}
    </div>
  )
}

function CloseButton({
  ariaLabel = `Close dialog`,
}: {
  ariaLabel?: string
}): React.ReactElement {
  return (
    <BaseDialog.Close
      render={
        <IconButton
          type="button"
          size={1}
          variant="ghost"
          tone="neutral"
          round
          aria-label={ariaLabel}
        >
          <Icon icon={X} size={2} />
        </IconButton>
      }
    />
  )
}

export const Dialog = {
  Root,
  Trigger: BaseDialog.Trigger,
  Close: BaseDialog.Close,
  Content,
  Title,
  Description,
  Header,
  Body,
  Footer,
  CloseButton,
}
