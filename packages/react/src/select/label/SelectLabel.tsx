'use client';
import { useStore } from '@base-ui/utils/store';
import { createLabel } from '../../utils/createLabel';
import type { LabelState, LabelProps } from '../../utils/createLabel';
import { useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';

/**
 * An accessible label that is automatically associated with the select trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectLabel = createLabel(() => {
  const { store } = useSelectRootContext();
  const controlElement = useStore(store, selectors.triggerElement);
  const rootId = useStore(store, selectors.id);
  return { store, rootId, controlElement };
});

export type SelectLabelState = LabelState;
export type SelectLabelProps = LabelProps;

export namespace SelectLabel {
  export type State = SelectLabelState;
  export type Props = SelectLabelProps;
}
