import { Popover as BasePopover } from '@base-ui/react/popover'
import type { CSSProperties, ReactNode } from 'react'
import styles from './Popover.module.css'

interface RootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean | `trap-focus`
  children?: ReactNode
}

type Side = `top` | `right` | `bottom` | `left`
type Align = `start` | `center` | `end`

interface ContentProps {
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  anchor?: React.ComponentProps<typeof BasePopover.Positioner>[`anchor`]
  initialFocus?: React.ComponentProps<typeof BasePopover.Popup>[`initialFocus`]
  finalFocus?: React.ComponentProps<typeof BasePopover.Popup>[`finalFocus`]
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /** Wrap children in default padding. Default true. */
  padded?: boolean
}

function Root({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  children,
}: RootProps): React.ReactElement {
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </BasePopover.Root>
  )
}

function Content({
  side = `bottom`,
  align = `center`,
  sideOffset = 6,
  alignOffset,
  anchor,
  initialFocus,
  finalFocus,
  className,
  style,
  padded = true,
  children,
}: ContentProps): React.ReactElement {
  const cls = [styles.popup, padded ? styles.padding : null, className]
    .filter(Boolean)
    .join(` `)
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        className={styles.positioner}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        anchor={anchor}
      >
        <BasePopover.Popup
          className={cls}
          style={style}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

/**
 * Popover — wraps `@base-ui/react/popover`.
 *
 * Usage:
 *   <Popover.Root>
 *     <Popover.Trigger render={<Button>Menu</Button>} />
 *     <Popover.Content side="bottom" align="start">…</Popover.Content>
 *   </Popover.Root>
 */
export const Popover = {
  Root,
  Trigger: BasePopover.Trigger,
  Close: BasePopover.Close,
  Content,
}
