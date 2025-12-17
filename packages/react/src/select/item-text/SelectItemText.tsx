'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItemText = React.memo(
  React.forwardRef(function SelectItemText(
    componentProps: SelectItemText.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { indexRef, textRef, selectedByFocus, hasRegistered } = useSelectItemContext();
    const { selectedItemTextRef } = useSelectRootContext();

    const { className, render, ...elementProps } = componentProps;

    const localRef = React.useCallback(
      (node: HTMLElement | null) => {
        if (!node || !hasRegistered) {
          return;
        }
        const hasNoSelectedItemText =
          selectedItemTextRef.current === null || !selectedItemTextRef.current.isConnected;
        if (selectedByFocus || (hasNoSelectedItemText && indexRef.current === 0)) {
          selectedItemTextRef.current = node;
        }
      },
      [selectedItemTextRef, indexRef, selectedByFocus, hasRegistered],
    );

    const element = useRenderElement('div', componentProps, {
      ref: [localRef, forwardedRef, textRef],
      props: elementProps,
    });

    return element;
  }),
);

export interface SelectItemTextState {}

export interface SelectItemTextProps extends BaseUIComponentProps<'div', SelectItemText.State> {}

export namespace SelectItemText {
  export type State = SelectItemTextState;
  export type Props = SelectItemTextProps;
}
