'use client';
import { DialogPortal } from '../../dialog/portal/DialogPortal';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerPortal = DialogPortal;

export interface DrawerPortalProps extends DialogPortal.Props {}
export interface DrawerPortalState extends DialogPortal.State {}

export namespace DrawerPortal {
  export type Props = DrawerPortalProps;
  export type State = DrawerPortalState;
}
