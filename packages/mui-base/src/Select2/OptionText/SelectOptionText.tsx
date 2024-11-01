import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../SelectRoot';
import { useSelectOptionContext } from '../Option/SelectOption';

interface InnerSelectOptionTextProps extends SelectOptionText.Props {
  selected: boolean;
  selectedOptionTextRef: React.RefObject<HTMLElement | null>;
  indexRef: React.RefObject<number>;
}

const InnerSelectOptionText = React.forwardRef(function InnerSelectOptionText(
  props: InnerSelectOptionTextProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, selected, selectedOptionTextRef, indexRef, ...otherProps } = props;

  const mergedRef = useForkRef<HTMLElement>(forwardedRef);

  const ownerState: SelectOptionText.OwnerState = React.useMemo(() => ({}), []);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (mergedRef) {
        mergedRef(node);
      }
      if (selected || (selectedOptionTextRef.current === null && indexRef.current === 0)) {
        selectedOptionTextRef.current = node;
      }
    },
    [mergedRef, selectedOptionTextRef, selected],
  );

  const { renderElement } = useComponentRenderer({
    ref,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

const MemoizedInnerSelectOptionText = React.memo(InnerSelectOptionText);

const SelectOptionText = React.forwardRef(function SelectOptionText(
  props: SelectOptionText.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { selected, indexRef } = useSelectOptionContext();
  const { selectedOptionTextRef } = useSelectRootContext();
  const mergedRef = useForkRef<HTMLElement>(forwardedRef);

  return (
    <MemoizedInnerSelectOptionText
      ref={mergedRef}
      selected={selected}
      selectedOptionTextRef={selectedOptionTextRef}
      indexRef={indexRef}
      {...props}
    />
  );
});

namespace SelectOptionText {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}

  export interface OwnerState {}
}

export { SelectOptionText };
