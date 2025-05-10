'use client';
import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useRenderElement } from '../../utils/useRenderElement';

interface InnerSelectItemTextProps extends SelectItemText.Props {
  selected: boolean;
  selectedItemTextRef: React.RefObject<HTMLElement | null>;
  indexRef: React.RefObject<number>;
}

const InnerSelectItemText = React.memo(
  React.forwardRef(function InnerSelectItemText(
    componentProps: InnerSelectItemTextProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { className, render, selected, selectedItemTextRef, indexRef, ...elementProps } =
      componentProps;

    const localRef = React.useCallback(
      (node: HTMLElement | null) => {
        // Wait for the DOM indices to be set.
        queueMicrotask(() => {
          if (selected || (selectedItemTextRef.current === null && indexRef.current === 0)) {
            selectedItemTextRef.current = node;
          }
        });
      },
      [selected, selectedItemTextRef, indexRef],
    );

    const renderElement = useRenderElement('div', componentProps, {
      ref: useForkRef<HTMLElement>(localRef, forwardedRef),
      props: elementProps,
    });

    return renderElement();
  }),
);

/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItemText = React.forwardRef(function SelectItemText(
  props: SelectItemText.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { selected, indexRef } = useSelectItemContext();
  const { selectedItemTextRef } = useSelectRootContext();

  return (
    <InnerSelectItemText
      ref={forwardedRef}
      selected={selected}
      selectedItemTextRef={selectedItemTextRef}
      indexRef={indexRef}
      {...props}
    />
  );
});

export namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
