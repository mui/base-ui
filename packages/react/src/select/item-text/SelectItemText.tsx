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
    const { selected, indexRef, textRef } = useSelectItemContext();
    const { selectedItemTextRef } = useSelectRootContext();

    const { className, render, ...elementProps } = componentProps;

    const localRef = React.useCallback(
      (node: HTMLElement | null) => {
        // Wait for the DOM indices to be set.
        queueMicrotask(() => {
          const hasNoSelectedItemText =
            selectedItemTextRef.current === null || !selectedItemTextRef.current.isConnected;
          if (selected || (hasNoSelectedItemText && indexRef.current === 0)) {
            selectedItemTextRef.current = node;
          }
        });
      },
      [selected, selectedItemTextRef, indexRef],
    );

    const element = useRenderElement('div', componentProps, {
      ref: [localRef, forwardedRef, textRef],
      props: elementProps,
    });

    return element;
  }),
);

export namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
