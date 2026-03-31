'use client';
import { useStore } from '@base-ui/utils/store';
import { createLabel } from '../../utils/createLabel';
import type { LabelState, LabelProps } from '../../utils/createLabel';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { selectors } from '../store';

/**
 * An accessible label that is automatically associated with the listbox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxLabel = createLabel(() => {
  const store = useListboxRootContext();
  const controlElement = useStore(store, selectors.listElement);
  const rootId = useStore(store, selectors.id);
  return { store, rootId, controlElement };
});

export type ListboxLabelState = LabelState;
export type ListboxLabelProps = LabelProps;

export namespace ListboxLabel {
  export type State = ListboxLabelState;
  export type Props = ListboxLabelProps;
}
