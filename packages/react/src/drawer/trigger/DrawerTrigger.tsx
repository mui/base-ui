'use client';
import type * as React from 'react';
import { DialogTrigger } from '../../dialog/trigger/DialogTrigger';
import type { DialogHandle as DrawerHandle } from '../../dialog/store/DialogHandle';
import type { NativeButtonComponentProps } from '../../internals/types';

/**
 * A button that opens the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerTrigger = DialogTrigger as DrawerTrigger;

export interface DrawerTrigger {
  <Payload = unknown, TElement extends React.ElementType = 'button'>(
    componentProps: DrawerTrigger.Props<Payload, true, TElement> &
      React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  <Payload = unknown, TElement extends React.ElementType = 'button'>(
    componentProps: DrawerTrigger.Props<Payload, false, TElement> & {
      nativeButton: false;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
  <Payload = unknown, TElement extends React.ElementType = 'button'>(
    componentProps: DrawerTrigger.Props<Payload, boolean, TElement> & {
      nativeButton: boolean;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export type DrawerTriggerProps<
  Payload = unknown,
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, DrawerTrigger.State> & {
  /**
   * A handle to associate the trigger with a drawer.
   * Can be created with the Drawer.createHandle() method.
   */
  handle?: DrawerHandle<Payload> | undefined;
  /**
   * A payload to pass to the drawer when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * ID of the trigger. In addition to being forwarded to the rendered element,
   * it is also used to specify the active trigger for drawers in controlled mode (with the Drawer.Root `triggerId` prop).
   */
  id?: string | undefined;
};

export interface DrawerTriggerState {
  /**
   * Whether the trigger is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the drawer is currently open and was opened by this trigger.
   */
  open: boolean;
}

export namespace DrawerTrigger {
  export type Props<
    Payload = unknown,
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = DrawerTriggerProps<Payload, TNativeButton, TElement>;
  export type State = DrawerTriggerState;
}
