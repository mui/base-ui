'use client';
import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { cn } from '../../utils/cn';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

export const Drawer = BaseDialog.Root;
export const DrawerTrigger = BaseDialog.Trigger;
export const DrawerClose = BaseDialog.Close;
export const DrawerPortal = BaseDialog.Portal;

export const DrawerBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Backdrop ref={ref} className={cn('mt-drawer-backdrop', className)} {...props} />
  )
);
DrawerBackdrop.displayName = 'DrawerBackdrop';

export interface DrawerPopupProps extends React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> {
  side?: DrawerSide;
}

export const DrawerPopup = React.forwardRef<HTMLDivElement, DrawerPopupProps>(
  ({ className, side = 'right', ...props }, ref) => (
    <BaseDialog.Popup ref={ref} className={cn('mt-drawer-popup', `mt-drawer-${side}`, className)} {...props} />
  )
);
DrawerPopup.displayName = 'DrawerPopup';

export const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Title>>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Title ref={ref} className={cn('mt-drawer-title', className)} {...props} />
  )
);
DrawerTitle.displayName = 'DrawerTitle';

export const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof BaseDialog.Description>>(
  ({ className, ...props }, ref) => (
    <BaseDialog.Description ref={ref} className={cn('mt-drawer-description', className)} {...props} />
  )
);
DrawerDescription.displayName = 'DrawerDescription';
