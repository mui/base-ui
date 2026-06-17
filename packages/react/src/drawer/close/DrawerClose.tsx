'use client';
import type * as React from 'react';
import { DialogClose } from '../../dialog/close/DialogClose';
import type { NativeButtonComponentProps } from '../../internals/types';

/**
 * A button that closes the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerClose = DialogClose as DrawerClose;

export type DrawerCloseProps<TNativeButton extends boolean = true> = NativeButtonComponentProps<
  TNativeButton,
  DrawerClose.State
>;

export interface DrawerCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export interface DrawerClose {
  (
    componentProps: DrawerClose.Props<true> & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  (
    componentProps: DrawerClose.Props<false> & {
      nativeButton: false;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
  (
    componentProps: DrawerClose.Props<boolean> & {
      nativeButton: boolean;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export namespace DrawerClose {
  export type Props<TNativeButton extends boolean = true> = DrawerCloseProps<TNativeButton>;
  export type State = DrawerCloseState;
}
