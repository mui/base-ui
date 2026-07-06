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
import { useRef, type ReactNode } from 'react'

import { Close12Icon, Error12Icon } from '@oxide/design-system/icons/react'

import { useIsOverflow } from '~/hooks/use-is-overflow'
import { Message } from '~/ui/lib/Message'
import { classed } from '~/util/classed'

import { DialogOverlay } from './DialogOverlay'
import { SideModalContext, useIsInModal, useIsInSideModal } from './modal-context'

export function usePopoverZIndex() {
  const isInModal = useIsInModal()
  const isInSideModal = useIsInSideModal()
  return isInModal
    ? 'z-(--z-modal-dropdown)'
    : isInSideModal
      ? 'z-(--z-side-modal-dropdown)'
      : 'z-(--z-content-dropdown)'
}

export type SideModalProps = {
  title: string
  subtitle?: ReactNode
  onDismiss: () => void
  isOpen: boolean
  children?: React.ReactNode
  errors?: string[]
  /**
   * Whether the modal should animate in. It never animates out. Default `true`.
   * Used to prevent animation from firing when we show the modal directly on a
   * fresh pageload.
   */
  animate?: boolean
}

export function SideModal({
  children,
  onDismiss,
  title,
  subtitle,
  animate = true,
  errors,
}: SideModalProps) {
  return (
    <SideModalContext.Provider value>
      <BaseDialog.Root
        open
        onOpenChange={(open) => {
          if (!open) onDismiss()
        }}
      >
        <BaseDialog.Portal>
          <DialogOverlay />
          <BaseDialog.Popup
            render={
              <m.div
                initial={{ x: animate ? 40 : 0 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                className="ox-side-modal bg-raise shadow-modal pointer-events-auto fixed top-0 right-0 bottom-0 z-(--z-side-modal) m-0 flex w-lg flex-col justify-between p-0"
              />
            }
          >
            <div className="mt-8 mb-4">
              <BaseDialog.Title className="text-sans-2xl text-raise flex w-full items-center justify-between pr-8 wrap-break-word">
                {title}
              </BaseDialog.Title>
              {subtitle}
            </div>
            {errors && errors.length > 0 && (
              <div className="mb-6">
                <Message
                  variant="error"
                  content={
                    errors.length === 1 ? (
                      errors[0]
                    ) : (
                      <>
                        <div>{errors.length} issues:</div>
                        <ul className="ml-4 list-disc">
                          {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </>
                    )
                  }
                  title={errors.length > 1 ? 'Errors' : 'Error'}
                />
              </div>
            )}
            {children}

            {/* Close button is here at the end so we aren't automatically focusing on it when the side modal is opened. Positioned in the safe area at the top */}
            <BaseDialog.Close
              className="hover:bg-hover absolute top-10 right-(--content-gutter) -m-2 flex rounded-md p-2"
              aria-label="Close"
            >
              <Close12Icon className="text-default" />
            </BaseDialog.Close>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </SideModalContext.Provider>
  )
}

export const ResourceLabel = classed.h3`mt-2 flex items-center gap-1.5 text-sans-md text-accent`

// separate component because otherwise eslint thinks it's not a component and
// gets mad about the use of hooks
function SideModalBody({ children }: { children?: ReactNode }) {
  const overflowRef = useRef<HTMLDivElement>(null)
  const { scrollStart } = useIsOverflow(overflowRef, 'vertical')

  return (
    <div
      ref={overflowRef}
      className={cn(
        'body relative h-full overflow-y-auto pt-8 pb-12 overscroll-none',
        !scrollStart && 'border-t-secondary border-t'
      )}
      data-testid="sidemodal-scroll-container"
    >
      {children}
    </div>
  )
}

SideModal.Body = SideModalBody

SideModal.Heading = classed.div`text-sans-semi-xl text-raise`

SideModal.Section = classed.div`p-8 space-y-6 border-secondary`

SideModal.Footer = ({ children, error }: { children: ReactNode; error?: boolean }) => (
  <footer className="border-secondary flex w-full items-center justify-end gap-2.5 border-t py-5 *:shrink-0">
    {error && (
      <div className="text-sans-md text-error flex grow items-center gap-1.5">
        <Error12Icon className="shrink-0" />
        <span>Error</span>
      </div>
    )}
    {children}
  </footer>
)
