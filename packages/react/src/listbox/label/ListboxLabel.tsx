'use client';
import * as React from 'react';
import type { Store } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFieldRootContext } from '../../internals/field-root-context';
import { fieldValidityMapping } from '../../internals/field-constants';
import { useLabel } from '../../internals/labelable-provider';
import type { FieldRoot } from '../../field';
import { useListboxRootContext } from '../root/ListboxRootContext';

function getDefaultLabelId(rootId: string | undefined) {
  return rootId ? `${rootId}-label` : undefined;
}

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

  const fieldRootContext = useFieldRootContext();

  const store = useListboxRootContext();
  const controlElement = store.useState('listElement');
  const rootId = store.useState('id');

  const defaultLabelId = getDefaultLabelId(rootId);

  const labelProps = useLabel({
    id: defaultLabelId,
    fallbackControlId: controlElement?.id ?? rootId,
    setLabelId(nextLabelId: string | undefined) {
      (store as Store<{ labelId: string | undefined }>).set('labelId', nextLabelId);
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
export type ListboxLabelProps = Omit<BaseUIComponentProps<'div', ListboxLabelState>, 'id'>;

export namespace ListboxLabel {
  export type State = ListboxLabelState;
  export type Props = ListboxLabelProps;
}
