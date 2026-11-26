'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { focusElementWithVisible, useLabel } from '../../internals/labelable-provider/useLabel';
import { getDefaultLabelId } from '../../utils/resolveAriaLabelledBy';
import { useListboxRootContext } from '../root/ListboxRootContext';

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
  const { render, className, style, ...elementProps } = componentProps;
  const elementPropsWithoutId = elementProps as typeof elementProps & {
    id?: string | undefined;
  };
  delete elementPropsWithoutId.id;

  const store = useListboxRootContext();
  const rootId = store.useState('id');

  const defaultLabelId = getDefaultLabelId(rootId);

  const setLabelId = useStableCallback((nextLabelId: React.SetStateAction<string | undefined>) => {
    const currentLabelId = store.state.labelId;
    const resolvedLabelId =
      typeof nextLabelId === 'function' ? nextLabelId(currentLabelId) : nextLabelId;
    store.set('labelId', resolvedLabelId);
  });

  // Focus the list element directly, so a custom or changed `id` on the list can't break it.
  function focusList() {
    const listElement = store.state.listElement;
    if (listElement) {
      focusElementWithVisible(listElement);
    }
  }

  const labelProps = useLabel({
    id: defaultLabelId,
    setLabelId,
    focusControl: focusList,
  });

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [labelProps, elementProps],
  });
});

export interface ListboxLabelState {}
export type ListboxLabelProps = Omit<BaseUIComponentProps<'div', ListboxLabelState>, 'id'>;

export namespace ListboxLabel {
  export type State = ListboxLabelState;
  export type Props = ListboxLabelProps;
}
