'use client';
import { DialogDescription } from '../../dialog/description/DialogDescription';

/**
 * A paragraph with additional information about the drawer.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerDescription = DialogDescription;

export interface DrawerDescriptionProps extends DialogDescription.Props {}
export interface DrawerDescriptionState extends DialogDescription.State {}

export namespace DrawerDescription {
  export type Props = DrawerDescriptionProps;
  export type State = DrawerDescriptionState;
}
