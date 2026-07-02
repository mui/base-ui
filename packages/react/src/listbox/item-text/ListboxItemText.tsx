'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useListboxItemContext } from '../item/ListboxItemContext';

/**
 * A text label of the listbox item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemText = React.memo(
  React.forwardRef(function ListboxItemText(
    componentProps: ListboxItemText.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { textRef } = useListboxItemContext();

    const { className, render, style, ...elementProps } = componentProps;

    const element = useRenderElement('div', componentProps, {
      ref: [forwardedRef, textRef],
      props: elementProps,
    });

    return element;
  }),
);

export interface ListboxItemTextState {}

export interface ListboxItemTextProps extends BaseUIComponentProps<'div', ListboxItemTextState> {}

export namespace ListboxItemText {
  export type State = ListboxItemTextState;
  export type Props = ListboxItemTextProps;
}
