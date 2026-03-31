'use client';
import { createLabel } from '../../utils/createLabel';
import type { LabelState, LabelProps } from '../../utils/createLabel';
import { useListboxRootContext } from '../root/ListboxRootContext';

/**
 * An accessible label that is automatically associated with the listbox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxLabel = createLabel(() => {
  const store = useListboxRootContext();
  const controlElement = store.useState('listElement');
  const rootId = store.useState('id');
  return { store, rootId, controlElement };
});

export type ListboxLabelState = LabelState;
export type ListboxLabelProps = LabelProps;

export namespace ListboxLabel {
  export type State = ListboxLabelState;
  export type Props = ListboxLabelProps;
}
