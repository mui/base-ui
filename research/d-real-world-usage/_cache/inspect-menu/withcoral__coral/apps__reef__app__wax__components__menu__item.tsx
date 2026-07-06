import { Menu as BaseMenu } from '@base-ui/react/menu'
import classNames from 'classnames'
import { Link, To } from 'react-router'

import { Icon } from '@/wax/components/icon'
import type { IconName } from '@/wax/components/icon'
import { Tooltip } from '@/wax/components/tooltip'

import * as styles from './menu.css'

export interface ItemProps {
  children: React.ReactNode
  className?: string
  closeOnClick?: boolean
  disabled?: boolean
  icon?: IconName
  onClick?: () => void
  to?: To
}

export function Item({
  children,
  className,
  closeOnClick = true,
  disabled = false,
  icon,
  onClick,
  to,
}: ItemProps) {
  const label = (
    <Tooltip content={children} showOnlyWhenTruncated>
      <span className={styles.itemLabel}>{children}</span>
    </Tooltip>
  )

  const content = (
    <>
      {icon && <Icon color="tertiary" name={icon} size="18" />}
      <div className={styles.itemContent}>{label}</div>
    </>
  )

  if (to) {
    return (
      <BaseMenu.Item
        className={classNames(styles.item, className)}
        closeOnClick={closeOnClick}
        disabled={disabled}
        onClick={onClick}
        render={<Link to={to} />}
      >
        {content}
      </BaseMenu.Item>
    )
  }

  return (
    <BaseMenu.Item
      className={classNames(styles.item, className)}
      closeOnClick={closeOnClick}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </BaseMenu.Item>
  )
}
