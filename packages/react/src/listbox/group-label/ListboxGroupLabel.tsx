'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useListboxGroupContext } from '../group/ListboxGroupContext';
import { useRenderElement } from '../../utils/useRenderElement';

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

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
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
