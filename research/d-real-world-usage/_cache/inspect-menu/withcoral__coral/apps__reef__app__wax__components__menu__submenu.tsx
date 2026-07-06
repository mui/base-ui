import { Menu as BaseMenu } from '@base-ui/react/menu'
import classNames from 'classnames'
import { RefObject } from 'react'

import { Icon } from '@/wax/components/icon'
import type { IconName } from '@/wax/components/icon'
import { Tooltip } from '@/wax/components/tooltip'

import * as styles from './menu.css'

export interface SubmenuContentProps {
  align?: 'center' | 'end' | 'start'
  alignOffset?: number
  children: React.ReactNode
  className?: string
  container?: HTMLElement | null | RefObject<HTMLElement | null>
  sideOffset?: number
}

export interface SubmenuProps {
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export interface SubmenuTriggerProps {
  children: React.ReactNode
  className?: string
  closeDelay?: number
  delay?: number
  disabled?: boolean
  icon?: IconName
  openOnHover?: boolean
}

export function Submenu({ children, onOpenChange, open }: SubmenuProps) {
  return (
    <BaseMenu.SubmenuRoot
      onOpenChange={onOpenChange ? (isOpen) => onOpenChange(isOpen) : undefined}
      open={open}
    >
      {children}
    </BaseMenu.SubmenuRoot>
  )
}

export function SubmenuContent({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  container,
  sideOffset = 0,
}: SubmenuContentProps) {
  return (
    <BaseMenu.Portal container={container}>
      <BaseMenu.Positioner
        align={align}
        alignOffset={alignOffset}
        side="right"
        sideOffset={sideOffset}
      >
        <BaseMenu.Popup className={classNames(styles.popup, className)}>{children}</BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

export function SubmenuTrigger({
  children,
  className,
  closeDelay,
  delay,
  disabled = false,
  icon,
  openOnHover = true,
}: SubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      className={classNames(styles.item, styles.submenuTrigger, className)}
      closeDelay={closeDelay}
      delay={delay}
      disabled={disabled}
      openOnHover={openOnHover}
    >
      {icon && <Icon color="tertiary" name={icon} size="18" />}
      <div className={styles.itemContent}>
        <Tooltip content={children} showOnlyWhenTruncated>
          <span className={styles.itemLabel}>{children}</span>
        </Tooltip>
      </div>
      <span className={styles.submenuArrow}>
        <Icon color="tertiary" name="ChevronRight" size="16" />
      </span>
    </BaseMenu.SubmenuTrigger>
  )
}
