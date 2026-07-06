'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cx } from 'class-variance-authority';
import { forwardRef } from 'react';
import styles from './command.module.css';

export const CommandDialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root {...props} />
);
CommandDialog.displayName = 'Command.Dialog';

export const CommandDialogTrigger = forwardRef<
  HTMLButtonElement,
  DialogPrimitive.Trigger.Props
>((props, ref) => <DialogPrimitive.Trigger ref={ref} {...props} />);
CommandDialogTrigger.displayName = 'Command.DialogTrigger';

export interface CommandDialogContentProps extends DialogPrimitive.Popup.Props {
  overlay?: DialogPrimitive.Backdrop.Props & { blur?: boolean };
  width?: string | number;
}

export function CommandDialogContent({
  className,
  children,
  overlay,
  width,
  style,
  ...props
}: CommandDialogContentProps) {
  const {
    blur = false,
    className: overlayClassName,
    ...overlayProps
  } = overlay ?? {};
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        {...overlayProps}
        className={cx(
          styles.backdrop,
          blur && styles.backdropBlur,
          overlayClassName
        )}
      />
      <DialogPrimitive.Viewport className={styles.viewport}>
        <DialogPrimitive.Popup
          className={cx(styles.dialogPopup, className)}
          style={{ width, ...style }}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}
CommandDialogContent.displayName = 'Command.DialogContent';
