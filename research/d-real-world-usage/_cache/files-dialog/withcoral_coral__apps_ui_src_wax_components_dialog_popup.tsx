import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import classNames from 'classnames'

import * as styles from './dialog.css'

export interface PopupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
  /** The width of the dialog. Defaults to 'm'. */
  size?: PopupSize
}

export type PopupSize = 'l' | 'm' | 'xl'

export function Popup({ children, className, ref, size = 'm', ...props }: PopupProps) {
  return (
    <BaseDialog.Popup
      className={classNames(styles.popup, styles.popupSize[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </BaseDialog.Popup>
  )
}
