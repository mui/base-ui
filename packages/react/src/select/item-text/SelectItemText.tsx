'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useRenderElement } from '../../utils/useRenderElement';

interface InnerSelectItemTextProps extends SelectItemText.Props {
  selectedByFocus: boolean;
  selectedItemTextRef: React.RefObject<HTMLElement | null>;
  indexRef: React.RefObject<number>;
  textRef: React.RefObject<HTMLElement | null>;
}

const InnerSelectItemText = React.memo(
  React.forwardRef(function InnerSelectItemText(
    componentProps: InnerSelectItemTextProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      className,
      render,
      selectedByFocus,
      selectedItemTextRef,
      indexRef,
      textRef,
      ...elementProps
    } = componentProps;

    const localRef = React.useCallback(
      (node: HTMLElement | null) => {
        // Wait for the DOM indices to be set.
        queueMicrotask(() => {
          const hasNoSelectedItemText =
            selectedItemTextRef.current === null || !selectedItemTextRef.current.isConnected;
          if (selectedByFocus || (hasNoSelectedItemText && indexRef.current === 0)) {
            selectedItemTextRef.current = node;
          }
        });
      },
      [selectedByFocus, selectedItemTextRef, indexRef],
    );

    const element = useRenderElement('div', componentProps, {
      ref: [localRef, forwardedRef, textRef],
      props: elementProps,
    });

    return element;
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
  const { selectedByFocus, indexRef } = useSelectItemContext();
  const { selectedItemTextRef } = useSelectRootContext();
  const { textRef } = useSelectItemContext();

  return (
    <InnerSelectItemText
      ref={forwardedRef}
      selectedByFocus={selectedByFocus}
      selectedItemTextRef={selectedItemTextRef}
      indexRef={indexRef}
      textRef={textRef}
      {...props}
    />
  );
});

export namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
