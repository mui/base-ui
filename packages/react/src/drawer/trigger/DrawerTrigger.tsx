'use client';
import type * as React from 'react';
import { DialogTrigger } from '../../dialog/trigger/DialogTrigger';
import type { DialogTriggerProps } from '../../dialog/trigger/DialogTrigger';

/**
 * A button that opens the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerTrigger = DialogTrigger as DrawerTrigger;

export type DrawerTriggerState = DialogTrigger.State;

export interface DrawerTrigger {
  <Payload>(
    componentProps: DrawerTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export type DrawerTriggerProps<Payload = unknown> = DialogTriggerProps<Payload>;

export namespace DrawerTrigger {
  export type Props<Payload = unknown> = DrawerTriggerProps<Payload>;
  export type State = DrawerTriggerState;
}
