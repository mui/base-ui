/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import cn from 'classnames'
import * as m from 'motion/react-m'
import type { MergeExclusive } from 'type-fest'

import { Close12Icon } from '@oxide/design-system/icons/react'

import { classed } from '~/util/classed'

import { Button } from './Button'
import { DialogOverlay } from './DialogOverlay'
import { ModalContext } from './modal-context'

type Width = 'narrow' | 'medium' | 'free'

const widthClass: Record<Width, string> = {
  narrow: 'w-full max-w-[24rem]',
  medium: 'w-full max-w-md',
  free: 'min-w-[24rem] max-w-3xl', // give it a big max just to be safe
}

export type ModalProps = {
  title: string
  isOpen: boolean
  children?: React.ReactNode
  onDismiss: () => void
  /** Default medium. Only needed in a couple of spots. */
  width?: Width
  /** Default true. We only need to hide it for the rare case of modal on top of modal. */
  overlay?: boolean
}

// Overlay sits above --z-side-modal and content above that, so the Modal fully
// covers a SideModal in the regrettable case where both are on screen at once.

export function Modal({
  children,
  onDismiss,
  title,
  isOpen,
  width = 'medium',
  overlay = true,
}: ModalProps) {
  return (
    <ModalContext.Provider value>
      <BaseDialog.Root
        open={isOpen}
        onOpenChange={(open, { reason }) => {
          // Ignore focus-out to prevent a dismiss loop when a native confirm()
          // dialog steals and returns focus (same role as the old Radix
          // onFocusOutside preventDefault). See oxidecomputer/console#1745.
          if (!open && reason !== 'focus-out') onDismiss()
        }}
      >
        <BaseDialog.Portal>
          {overlay && <DialogOverlay />}
          <BaseDialog.Popup
            render={
              <m.div
                initial={{ x: '-50%', y: 'calc(-50% - 25px)' }}
                animate={{ x: '-50%', y: '-50%' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                className={cn(
                  'bg-raise light:bg-default shadow-modal pointer-events-auto fixed top-[min(50%,500px)] left-1/2 z-(--z-modal) m-0 flex max-h-[min(800px,80vh)] flex-col justify-between overflow-hidden rounded-lg p-0',
                  widthClass[width]
                )}
              />
            }
          >
            <BaseDialog.Title className="text-sans-semi-lg bg-secondary light:bg-raise border-b-secondary border-b px-4 py-4">
              {title}
            </BaseDialog.Title>
            {children}
            <BaseDialog.Close
              className="hover:bg-hover absolute top-3.5 right-2 flex items-center justify-center rounded-md p-2"
              aria-label="Close"
            >
              <Close12Icon className="text-default" />
            </BaseDialog.Close>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </ModalContext.Provider>
  )
}

Modal.Body = classed.div`py-2 overflow-y-auto overscroll-none`

Modal.Section = classed.div`p-4 space-y-4 border-b border-secondary text-default last-of-type:border-none text-sans-md`

/**
 * `formId` and `onAction` are mutually exclusive. If there is a form associated,
 * the button becomes a submit button for that form, and the action is assumed to
 * be hooked up in the form's `onSubmit`.
 */
type FooterProps = {
  children?: React.ReactNode
  onDismiss: () => void
  actionType?: 'primary' | 'danger'
  actionText: React.ReactNode
  actionLoading?: boolean
  cancelText?: string
  disabled?: boolean
  disabledReason?: React.ReactNode
  showCancel?: boolean
} & MergeExclusive<{ formId: string }, { onAction: () => void }>

Modal.Footer = ({
  children,
  onDismiss,
  onAction,
  actionType = 'primary',
  actionText,
  actionLoading,
  cancelText,
  disabled,
  disabledReason,
  formId,
  showCancel = true,
}: FooterProps) => (
  <footer className="border-secondary flex items-center justify-between border-t px-4 py-3">
    <div className="mr-4">{children}</div>
    <div className="space-x-2">
      {showCancel && (
        <Button variant="secondary" size="sm" onClick={onDismiss}>
          {cancelText || 'Cancel'}
        </Button>
      )}
      <Button
        type={formId ? 'submit' : 'button'}
        form={formId}
        size="sm"
        variant={actionType}
        onClick={onAction}
        disabled={!!disabled}
        disabledReason={disabledReason}
        loading={actionLoading}
      >
        {actionText}
      </Button>
    </div>
  </footer>
)
