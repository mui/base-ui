'use client';
import * as React from 'react';
import { DialogTrigger } from '../../dialog/trigger/DialogTrigger';
import type { DialogTriggerProps } from '../../dialog/trigger/DialogTrigger';

/**
 * A button that opens the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerTrigger = React.forwardRef(function DrawerTrigger(
  componentProps: DrawerTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <DialogTrigger
      {...(componentProps as DialogTriggerProps<never>)}
      payload={undefined}
      handle={undefined}
      ref={forwardedRef}
    />
  );
});

export type DrawerTriggerState = DialogTrigger.State;

export interface DrawerTriggerProps extends Omit<DialogTriggerProps<never>, 'payload' | 'handle'> {}

export namespace DrawerTrigger {
  export type Props = DrawerTriggerProps;
  export type State = DrawerTriggerState;
}
