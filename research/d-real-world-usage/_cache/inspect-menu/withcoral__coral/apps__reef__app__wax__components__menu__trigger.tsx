import { Menu as BaseMenu } from '@base-ui/react/menu'
import classNames from 'classnames'

import * as styles from './menu.css'

export interface TriggerProps {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement<Record<string, unknown>>
}

export function Trigger({ children, className, render }: TriggerProps) {
  const nativeButton = !render || render.type === 'button'
  return (
    <BaseMenu.Trigger
      className={classNames(styles.trigger, className)}
      nativeButton={nativeButton}
      render={render}
    >
      {children}
    </BaseMenu.Trigger>
  )
}
