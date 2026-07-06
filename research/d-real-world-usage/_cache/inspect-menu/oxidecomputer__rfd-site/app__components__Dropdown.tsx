/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Menu } from '@base-ui/react/menu'
import cn from 'classnames'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import Icon from '~/components/Icon'

// Re-export Root with modal={false} default to prevent scroll locking
export function Root({ children, ...props }: React.ComponentProps<typeof Menu.Root>) {
  return (
    <Menu.Root modal={false} {...props}>
      {children}
    </Menu.Root>
  )
}

export const Trigger = Menu.Trigger

type ContentProps = {
  className?: string
  children: ReactNode
  align?: 'end' | 'start' | 'center'
  gap?: number
  portal?: boolean
}

export function Content({
  className,
  children,
  align = 'end',
  gap = 8,
  portal = true,
}: ContentProps) {
  // When `portal` is false, render the popup into an inline container sibling
  // so it stays in the scroll context of its trigger instead of portalling to
  // document.body (which causes Floating UI scroll catch-up in sticky headers).
  const [inlineContainer, setInlineContainer] = useState<HTMLSpanElement | null>(null)
  return (
    <>
      {!portal && <span ref={setInlineContainer} style={{ position: 'absolute' }} />}
      <Menu.Portal container={portal ? undefined : inlineContainer}>
        <Menu.Positioner side="bottom" align={align} sideOffset={gap}>
          <Menu.Popup
            className={cn('dropdown-menu-content shadow-menu outline-hidden', className)}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </>
  )
}

type SubContentProps = {
  className?: string
  children: ReactNode
}

export function SubContent({ className, children }: SubContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={1}>
        <Menu.Popup
          className={cn('dropdown-menu-content shadow-menu outline-hidden', className)}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

type ItemProps = {
  children: ReactNode | string
  className?: string
  onSelect?: () => void
  disabled?: boolean
}

export function Item({ children, className, onSelect, disabled }: ItemProps) {
  return (
    <Menu.Item
      disabled={disabled ?? !onSelect}
      onClick={onSelect}
      className={cn(
        'DropdownMenuItem ox-menu-item',
        className,
        !onSelect && 'cursor-default',
      )}
    >
      {children}
    </Menu.Item>
  )
}

type LinkItemProps = {
  className?: string
  children: ReactNode
  to: string
  disabled?: boolean
  internal?: boolean
}

export function LinkItem({ className, children, to, disabled, internal }: LinkItemProps) {
  const ext = !internal && /^https?:/.test(to)
  return (
    <Menu.Item
      disabled={disabled}
      render={
        ext ? (
          <a // eslint-disable-line jsx-a11y/anchor-has-content
            href={to}
            target="_blank"
            rel="noreferrer"
            className={cn('DropdownMenuItem ox-menu-item', className)}
          />
        ) : (
          <Link to={to} className={cn('DropdownMenuItem ox-menu-item', className)} />
        )
      }
    >
      {children}
    </Menu.Item>
  )
}

export const Submenu = Menu.SubmenuRoot

export function SubmenuTrigger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Menu.SubmenuTrigger className={cn('DropdownMenuItem ox-menu-item', className)}>
      {children}
      <Icon name="carat-right" size={12} className="text-tertiary absolute right-3" />
    </Menu.SubmenuTrigger>
  )
}

export const RadioGroup = Menu.RadioGroup
export const RadioItem = Menu.RadioItem
export const Separator = Menu.Separator

// ---- Legacy-named exports for existing consumers ----

export const DropdownItem = Item
export const DropdownMenu = Content
export const DropdownSubTrigger = SubmenuTrigger
export const DropdownSubMenu = SubContent
export const DropdownLink = LinkItem
