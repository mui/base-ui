'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';
import { useListboxGroupContext } from '../group/ListboxGroupContext';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxGroupLabel = React.forwardRef(function ListboxGroupLabel(
  componentProps: ListboxGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, id: idProp, ...elementProps } = componentProps;

  const { setLabelId } = useListboxGroupContext();

  const id = useRegisteredLabelId(idProp, setLabelId);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ id, 'aria-hidden': true }, elementProps],
  });

  return element;
});

export interface ListboxGroupLabelState {}

export interface ListboxGroupLabelProps extends BaseUIComponentProps<
  'div',
  ListboxGroupLabelState
> {}

export namespace ListboxGroupLabel {
  export type State = ListboxGroupLabelState;
  export type Props = ListboxGroupLabelProps;
}
