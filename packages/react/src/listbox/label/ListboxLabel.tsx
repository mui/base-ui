'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { useLabel } from '../../labelable-provider/useLabel';
import { getDefaultLabelId } from '../../utils/resolveAriaLabelledBy';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { selectors } from '../store';

/**
 * An accessible label that is automatically associated with the listbox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxLabel = React.forwardRef(function ListboxLabel(
  componentProps: ListboxLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;
  const elementPropsWithoutId = elementProps as typeof elementProps & { id?: string | undefined };
  delete elementPropsWithoutId.id;

  const fieldRootContext = useFieldRootContext();
  const { store } = useListboxRootContext();

  const listElement = useStore(store, selectors.listElement);
  const rootId = useStore(store, selectors.id);
  const defaultLabelId = getDefaultLabelId(rootId);

  const labelProps = useLabel({
    id: defaultLabelId,
    fallbackControlId: listElement?.id ?? rootId,
    setLabelId(nextLabelId) {
      store.set('labelId', nextLabelId);
    },
  });

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state: fieldRootContext.state,
    props: [labelProps, elementProps],
    stateAttributesMapping: fieldValidityMapping,
  });
});

export type ListboxLabelState = FieldRoot.State;

export interface ListboxLabelProps
  extends Omit<BaseUIComponentProps<'div', ListboxLabel.State>, 'id'> {}

export namespace ListboxLabel {
  export type State = ListboxLabelState;
  export type Props = ListboxLabelProps;
}
