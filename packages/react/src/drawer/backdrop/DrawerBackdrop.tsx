'use client';
import { DialogBackdrop } from '../../dialog/backdrop/DialogBackdrop';

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerBackdrop = DialogBackdrop;

export interface DrawerBackdropProps extends DialogBackdrop.Props {}
export interface DrawerBackdropState extends DialogBackdrop.State {}

export namespace DrawerBackdrop {
  export type Props = DrawerBackdropProps;
  export type State = DrawerBackdropState;
}
