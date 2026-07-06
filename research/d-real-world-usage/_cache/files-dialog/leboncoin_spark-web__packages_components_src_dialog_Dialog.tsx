import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { ComponentProps, type ReactElement } from 'react'

import { DialogProvider } from './DialogContext'

export interface DialogProps extends Omit<
  ComponentProps<typeof BaseDialog.Root>,
  'onOpenChange' | 'render'
> {
  /**
   * Specifies if the dialog is open or not.
   */
  open?: boolean
  /**
   * Default open state.
   */
  defaultOpen?: boolean
  /**
   * Handler executed on every dialog open state change.
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Specifies if the dialog is a modal.
   */
  modal?: boolean
  /**
   * Specifies if the dialog should have a fade animation on its body (in case it is scrollable).
   */
  withFade?: boolean
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   */
  asChild?: boolean
}

export const Dialog = ({ withFade = false, onOpenChange, ...props }: DialogProps): ReactElement => {
  const handleOpenChange = onOpenChange
    ? (open: boolean, _eventDetails: unknown) => {
        onOpenChange(open)
      }
    : undefined

  return (
    <DialogProvider withFade={withFade}>
      <BaseDialog.Root data-spark-component="dialog" onOpenChange={handleOpenChange} {...props} />
    </DialogProvider>
  )
}

Dialog.createHandle = BaseDialog.createHandle
Dialog.displayName = 'Dialog.Root'
