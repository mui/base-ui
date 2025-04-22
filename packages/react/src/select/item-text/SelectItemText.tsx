'use client';
import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectItemContext } from '../item/SelectItemContext';

interface InnerSelectItemTextProps extends SelectItemText.Props {
  selected: boolean;
  selectedItemTextRef: React.RefObject<HTMLElement | null>;
  indexRef: React.RefObject<number>;
}

const InnerSelectItemText = React.forwardRef(function InnerSelectItemText(
  props: InnerSelectItemTextProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, selected, selectedItemTextRef, indexRef, ...otherProps } = props;

  const mergedRef = useForkRef<HTMLElement>(forwardedRef);

  const state: SelectItemText.State = React.useMemo(() => ({}), []);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (mergedRef) {
        mergedRef(node);
      }

      // Wait for the DOM indices to be set.
      queueMicrotask(() => {
        if (selected || (selectedItemTextRef.current === null && indexRef.current === 0)) {
          selectedItemTextRef.current = node;
        }
      });
    },
    [mergedRef, selected, selectedItemTextRef, indexRef],
  );

  const { renderElement } = useComponentRenderer({
    ref,
    render: render ?? 'div',
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

const MemoizedInnerSelectItemText = React.memo(InnerSelectItemText);

/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectItemText = React.forwardRef(function SelectItemText(
  props: SelectItemText.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { selected, indexRef } = useSelectItemContext();
  const { selectedItemTextRef } = useSelectRootContext();
  const mergedRef = useForkRef<HTMLElement>(forwardedRef);

  return (
    <MemoizedInnerSelectItemText
      ref={mergedRef}
      selected={selected}
      selectedItemTextRef={selectedItemTextRef}
      indexRef={indexRef}
      {...props}
    />
  );
});

namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}

export { SelectItemText };
