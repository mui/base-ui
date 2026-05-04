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

export type DrawerCloseProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, DrawerClose.State>;

export interface DrawerCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export interface DrawerClose {
  <TElement extends React.ElementType = 'button'>(
    componentProps: DrawerClose.Props<true, TElement> & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'button'>(
    componentProps: DrawerClose.Props<false, TElement> & {
      nativeButton: false;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'button'>(
    componentProps: DrawerClose.Props<boolean, TElement> & {
      nativeButton: boolean;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export namespace DrawerClose {
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = DrawerCloseProps<TNativeButton, TElement>;
  export type State = DrawerCloseState;
}
