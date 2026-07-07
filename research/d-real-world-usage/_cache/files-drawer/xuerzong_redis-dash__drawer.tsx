import { Dialog } from '@base-ui-components/react/dialog'
import { IconButton } from '../Button'
import { XIcon } from 'lucide-react'
import './index.scss'

interface DrawerProps {
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  footer?: React.ReactNode
}

export const Drawer: React.FC<React.PropsWithChildren<DrawerProps>> = ({
  title,
  description,
  open,
  onOpenChange,
  trigger,
  children,
  footer,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Backdrop className="DrawerBackdrop" />
        <Dialog.Popup className="DrawerContent">
          <div className="DrawerHeader">
            <Dialog.Title className="DrawerTitle">{title}</Dialog.Title>
            <Dialog.Description className="DrawerDescription">
              {description}
            </Dialog.Description>

            <IconButton
              className="DrawerCloseIcon"
              variant="ghost"
              onClick={() => {
                onOpenChange?.(false)
              }}
            >
              <XIcon />
            </IconButton>
          </div>
          <div className="DrawerWrapper">{children}</div>
          {footer}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
