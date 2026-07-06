import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode, Ref } from "react";

import { isElectron } from "../lib/electron";
import { XMarkIcon } from "./XMarkIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullScreenMobile?: boolean;
  showClose?: boolean;
  closeDisabled?: boolean;
  autoFocusClose?: boolean;
  contentRef?: Ref<HTMLDivElement>;
  skipOpenAnimation?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

const fullScreenMobileSizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  fullScreenMobile = false,
  showClose = true,
  closeDisabled = false,
  autoFocusClose = false,
  contentRef,
  skipOpenAnimation = false,
}: Props) {
  const noAnim = skipOpenAnimation ? " no-animation" : "";
  const noDrag = isElectron() ? " app-window-no-drag" : "";
  const popupClasses = fullScreenMobile
    ? `dialog-popup${noAnim}${noDrag} fixed z-50 bg-(--color-bg-elevated) shadow-2xl flex flex-col focus:outline-none inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full h-full sm:h-auto sm:max-h-[90vh] sm:ring sm:ring-(--color-ring-elevated) dark:shadow-contrast sm:rounded-2xl ${fullScreenMobileSizeClasses[size]}`
    : `dialog-popup${noAnim}${noDrag} fixed z-50 bg-(--color-bg-elevated) shadow-2xl flex flex-col focus:outline-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${sizeClasses[size]} ring ring-(--color-ring-elevated) dark:shadow-contrast rounded-2xl`;
  const backdropClasses = `dialog-backdrop${noAnim} fixed inset-0 bg-(--color-overlay) backdrop-blur-[3px] z-40${isElectron() ? " app-window-drag" : ""}`;

  return (
    <BaseDialog.Root open={open} onOpenChange={(isOpen) => !isOpen && !closeDisabled && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={backdropClasses} />
        <BaseDialog.Popup className={popupClasses}>
          {showClose && (
            <BaseDialog.Close
              autoFocus={autoFocusClose}
              disabled={closeDisabled}
              className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-(--color-text-muted) hover:bg-(--color-bg-muted) hover:text-(--color-text) disabled:opacity-50"
            >
              <XMarkIcon />
            </BaseDialog.Close>
          )}

          <div
            ref={contentRef}
            className={
              fullScreenMobile
                ? "min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4 sm:px-6 sm:pb-6"
                : "p-6"
            }
          >
            <div className="mb-4 pr-8">
              <BaseDialog.Title className="text-lg font-semibold">{title}</BaseDialog.Title>
              {description && (
                <p className="mt-1 text-sm text-(--color-text-muted)">{description}</p>
              )}
            </div>
            {children}
          </div>

          {footer}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
