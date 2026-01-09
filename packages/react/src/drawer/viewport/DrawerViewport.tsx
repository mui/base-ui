'use client';
import { DialogViewport } from '../../dialog/viewport/DialogViewport';

/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerViewport = DialogViewport;

export interface DrawerViewportProps extends DialogViewport.Props {}
export interface DrawerViewportState extends DialogViewport.State {}

export namespace DrawerViewport {
  export type Props = DrawerViewportProps;
  export type State = DrawerViewportState;
}
