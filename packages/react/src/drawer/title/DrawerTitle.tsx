'use client';
import { DialogTitle } from '../../dialog/title/DialogTitle';

/**
 * A heading that labels the drawer.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerTitle = DialogTitle;

export interface DrawerTitleProps extends DialogTitle.Props {}
export interface DrawerTitleState extends DialogTitle.State {}

export namespace DrawerTitle {
  export type Props = DrawerTitleProps;
  export type State = DrawerTitleState;
}
