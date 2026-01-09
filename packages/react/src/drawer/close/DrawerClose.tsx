'use client';
import { DialogClose } from '../../dialog/close/DialogClose';

/**
 * A button that closes the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerClose = DialogClose;

export interface DrawerCloseProps extends DialogClose.Props {}
export interface DrawerCloseState extends DialogClose.State {}

export namespace DrawerClose {
  export type Props = DrawerCloseProps;
  export type State = DrawerCloseState;
}
