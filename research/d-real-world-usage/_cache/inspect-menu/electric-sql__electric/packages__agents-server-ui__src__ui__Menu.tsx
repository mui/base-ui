import { Menu as BaseMenu } from '@base-ui/react/menu'
import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import popoverStyles from './Popover.module.css'
import styles from './Menu.module.css'

interface RootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

type Side = `top` | `right` | `bottom` | `left`
type Align = `start` | `center` | `end`

interface ContentProps {
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

interface ItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, `onSelect`> {
  /** Optional tone — `danger` for destructive actions like Delete. */
  tone?: `default` | `danger`
  disabled?: boolean
  /** Mirrors Radix's `onSelect` — fired when the item is activated. */
  onSelect?: (event: Event) => void
}

function Root({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: RootProps): React.ReactElement {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseMenu.Root>
  )
}

function Content({
  side = `bottom`,
  align = `start`,
  sideOffset = 6,
  alignOffset,
  className,
  style,
  children,
}: ContentProps): React.ReactElement {
  const cls = [popoverStyles.popup, styles.popup, className]
    .filter(Boolean)
    .join(` `)
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        className={popoverStyles.positioner}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseMenu.Popup className={cls} style={style}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

const Item = forwardRef<HTMLDivElement, ItemProps>(function Item(
  { tone = `default`, className, onSelect, onClick, ...rest },
  ref
) {
  const cls = [styles.item, className].filter(Boolean).join(` `)
  return (
    <BaseMenu.Item
      ref={ref}
      {...rest}
      className={cls}
      data-tone={tone === `danger` ? `danger` : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) onSelect?.(e.nativeEvent)
      }}
    />
  )
})

function Separator({ className }: { className?: string }): React.ReactElement {
  return (
    <BaseMenu.Separator
      className={[styles.separator, className].filter(Boolean).join(` `)}
    />
  )
}

function Label({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <BaseMenu.GroupLabel
      className={[styles.label, className].filter(Boolean).join(` `)}
    >
      {children}
    </BaseMenu.GroupLabel>
  )
}

/**
 * Dropdown menu — wraps `@base-ui/react/menu`.
 *
 * Replaces `DropdownMenu.Root / Trigger / Content / Item / Separator`
 * from `@radix-ui/themes`. The Item wrapper accepts a `tone="danger"`
 * to colour destructive actions and exposes Radix-style `onSelect`.
 */
export const Menu = {
  Root,
  Trigger: BaseMenu.Trigger,
  Content,
  Item,
  Separator,
  Label,
  Group: BaseMenu.Group,
  SubmenuRoot: BaseMenu.SubmenuRoot,
  SubmenuTrigger: BaseMenu.SubmenuTrigger,
}
