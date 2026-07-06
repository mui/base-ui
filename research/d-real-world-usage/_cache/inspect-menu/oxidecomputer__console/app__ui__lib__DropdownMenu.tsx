/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Menu } from '@base-ui/react/menu'
import cn from 'classnames'
import { type ReactNode, type Ref } from 'react'
import { Link } from 'react-router'

import { OpenLink12Icon } from '@oxide/design-system/icons/react'

import { Wrap } from '../util/wrap'
import { Tooltip } from './Tooltip'

// Re-export Root with modal={false} default to prevent scroll locking
export function Root({ children, ...props }: React.ComponentProps<typeof Menu.Root>) {
  return (
    <Menu.Root modal={false} {...props}>
      {children}
    </Menu.Root>
  )
}

export const Trigger = Menu.Trigger

type AnchorProp = string | { to: string; offset?: number; gap?: number }

function parseAnchor(
  anchor: AnchorProp,
  gap?: number
): {
  side: 'bottom' | 'top' | 'left' | 'right'
  align: 'start' | 'center' | 'end'
  sideOffset: number
  alignOffset: number
} {
  const anchorStr = typeof anchor === 'string' ? anchor : anchor.to
  const parts = anchorStr.split(' ')
  const side = (parts[0] ?? 'bottom') as 'bottom' | 'top' | 'left' | 'right'
  const align = (parts[1] ?? 'end') as 'start' | 'center' | 'end'
  const alignOffset = typeof anchor === 'object' ? (anchor.offset ?? 0) : 0
  const sideOffset = gap ?? (typeof anchor === 'object' ? (anchor.gap ?? 0) : 0)
  return { side, align, sideOffset, alignOffset }
}

const zIndexClass = {
  dropdown: 'z-(--z-content-dropdown)',
  topBar: 'z-(--z-top-bar-dropdown)',
  modal: 'z-(--z-modal-dropdown)',
  sideModal: 'z-(--z-side-modal-dropdown)',
} as const

type ZIndex = keyof typeof zIndexClass

type ContentProps = {
  className?: string
  children: ReactNode
  anchor?: AnchorProp
  /** Spacing in px between trigger and menu */
  gap?: 8
  zIndex?: ZIndex
  collisionPadding?: React.ComponentProps<typeof Menu.Positioner>['collisionPadding']
}

export function Content({
  className,
  children,
  anchor = 'bottom end',
  gap,
  zIndex = 'dropdown',
  collisionPadding,
}: ContentProps) {
  const { side, align, sideOffset, alignOffset } = parseAnchor(anchor, gap)
  return (
    <Menu.Portal>
      <Menu.Positioner
        className={zIndexClass[zIndex]}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
      >
        <Menu.Popup
          className={cn('dropdown-menu-content shadow-menu outline-hidden', className)}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

type SubContentProps = {
  className?: string
  children: ReactNode
}

export function SubContent({ className, children }: SubContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="z-(--z-top-bar-dropdown)" sideOffset={1}>
        <Menu.Popup
          className={cn('dropdown-menu-content shadow-menu outline-hidden', className)}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

type LinkItemProps = {
  className?: string
  to: string
  children: string | React.ReactElement
}

export function LinkItem({ className, to, children }: LinkItemProps) {
  // rather lazy test for external links
  const ext = /^https?:/.test(to) ? { rel: 'noreferrer', target: '_blank' } : undefined
  return (
    <Menu.Item
      render={
        <Link className={cn('DropdownMenuItem ox-menu-item', className)} to={to} {...ext} />
      }
    >
      {children} {ext ? <OpenLink12Icon className="ml-1.5" /> : null}
    </Menu.Item>
  )
}

type ItemProps = {
  label: string
  className?: string
  onSelect: () => void
  /* If present, ReactNode will be displayed in a tooltip */
  disabled?: React.ReactNode
  ref?: Ref<HTMLDivElement>
}

export const Item = ({ className, onSelect, label, disabled, ref }: ItemProps) => (
  <Wrap key={label} when={!!disabled} with={<Tooltip content={disabled} />}>
    <Menu.Item
      ref={ref}
      disabled={!!disabled}
      onClick={onSelect}
      className={cn('DropdownMenuItem ox-menu-item', className)}
    >
      {label}
    </Menu.Item>
  </Wrap>
)

export const Submenu = Menu.SubmenuRoot
export const SubmenuTrigger = Menu.SubmenuTrigger
export const RadioGroup = Menu.RadioGroup
export const RadioItem = Menu.RadioItem
export const Separator = Menu.Separator
