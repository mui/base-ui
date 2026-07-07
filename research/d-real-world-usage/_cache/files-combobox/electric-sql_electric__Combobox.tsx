import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import { Check } from 'lucide-react'
import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { Icon } from './Icon'
import popoverStyles from './Popover.module.css'
import styles from './Combobox.module.css'

type Side = `top` | `right` | `bottom` | `left`
type Align = `start` | `center` | `end`

interface RootProps<V extends string> {
  value?: V | null
  defaultValue?: V | null
  /**
   * Called when the selected value changes. Receives `null` when the
   * user clears the combobox or selects an item whose value is `null`
   * (i.e. when the combobox is acting as a clearable input).
   */
  onValueChange?: (value: V | null) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (inputValue: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** Submitted form name + value (when used inside a `<form>`). */
  name?: string
  required?: boolean
  children?: ReactNode
}

interface ContentProps {
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, `value`> {
  className?: string
}

interface ItemProps<V extends string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, `children`> {
  value: V
  disabled?: boolean
  children: ReactNode
}

function Root<V extends string>({
  value,
  defaultValue,
  onValueChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  name,
  required,
  children,
}: RootProps<V>): React.ReactElement {
  return (
    <BaseCombobox.Root<string>
      value={value as string | null | undefined}
      defaultValue={defaultValue as string | null | undefined}
      onValueChange={
        onValueChange
          ? (v: string | null) => onValueChange(v as V | null)
          : undefined
      }
      inputValue={inputValue}
      defaultInputValue={defaultInputValue}
      onInputValueChange={
        onInputValueChange ? (v: string) => onInputValueChange(v) : undefined
      }
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={
        onOpenChange ? (next: boolean) => onOpenChange(next) : undefined
      }
      disabled={disabled}
      name={name}
      required={required}
    >
      {children}
    </BaseCombobox.Root>
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
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner
        className={popoverStyles.positioner}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseCombobox.Popup className={cls} style={style}>
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  )
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref
) {
  return (
    <BaseCombobox.Input
      ref={ref}
      className={[styles.input, className].filter(Boolean).join(` `)}
      {...rest}
    />
  )
})

function List({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <BaseCombobox.List
      className={[styles.list, className].filter(Boolean).join(` `)}
    >
      {children}
    </BaseCombobox.List>
  )
}

function Item<V extends string>({
  value,
  disabled,
  className,
  children,
  ...rest
}: ItemProps<V>): React.ReactElement {
  return (
    <BaseCombobox.Item
      value={value}
      disabled={disabled}
      className={[styles.item, className].filter(Boolean).join(` `)}
      {...rest}
    >
      {children}
    </BaseCombobox.Item>
  )
}

/**
 * Trailing indicator for the selected row. Defaults to a check icon
 * sized to match the rest of the dropdown chrome — pass `render` to
 * substitute a different glyph.
 */
function ItemIndicator({
  className,
  render,
}: {
  className?: string
  render?: React.ReactElement
}): React.ReactElement {
  return (
    <BaseCombobox.ItemIndicator
      className={[styles.indicator, className].filter(Boolean).join(` `)}
      render={render ?? <Icon icon={Check} size={2} />}
    />
  )
}

function Empty({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.ReactElement {
  return (
    <BaseCombobox.Empty
      className={[styles.empty, className].filter(Boolean).join(` `)}
    >
      {children}
    </BaseCombobox.Empty>
  )
}

function Separator({ className }: { className?: string }): React.ReactElement {
  return (
    <BaseCombobox.Separator
      className={[styles.separator, className].filter(Boolean).join(` `)}
    />
  )
}

/**
 * Filterable list-with-input — wraps `@base-ui/react/combobox`.
 *
 * Sibling to `Menu` / `Select` / `Popover`, sharing the same popup
 * surface tokens (`popoverStyles.popup`) and item geometry. Use it
 * when you need a dropdown that lets the user *type* to filter or
 * paste a freeform value, in addition to picking from a list.
 *
 *   <Combobox.Root value={v} onValueChange={setV}>
 *     <Combobox.Trigger render={<button>{v ?? `Pick`}</button>} />
 *     <Combobox.Content>
 *       <Combobox.Input placeholder="Filter…" />
 *       <Combobox.List>
 *         <Combobox.Item value="a">
 *           A <Combobox.ItemIndicator />
 *         </Combobox.Item>
 *       </Combobox.List>
 *     </Combobox.Content>
 *   </Combobox.Root>
 *
 * Generic API mirrors `Select<V extends string>`: `value`, `onValueChange`,
 * `defaultValue`, `disabled`, `name`, `required`. The trigger is exposed
 * straight from the underlying primitive so consumers control it via
 * `render={<button…/>}`, matching the Menu API.
 */
export const Combobox = {
  Root,
  Trigger: BaseCombobox.Trigger,
  Content,
  Input,
  List,
  Item,
  ItemIndicator,
  Empty,
  Separator,
  Group: BaseCombobox.Group,
  GroupLabel: BaseCombobox.GroupLabel,
}
