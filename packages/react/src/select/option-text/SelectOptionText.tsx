'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectOptionContext } from '../option/SelectOptionContext';

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

  const state: SelectOptionText.State = React.useMemo(() => ({}), []);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (mergedRef) {
        mergedRef(node);
      }

      // Wait for the DOM indices to be set.
      queueMicrotask(() => {
        if (selected || (selectedOptionTextRef.current === null && indexRef.current === 0)) {
          selectedOptionTextRef.current = node;
        }
      });
    },
    [mergedRef, selected, selectedOptionTextRef, indexRef],
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

InnerSelectOptionText.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  indexRef: PropTypes.shape({
    current: PropTypes.number.isRequired,
  }).isRequired,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  selected: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  selectedOptionTextRef: PropTypes.shape({
    current: (props, propName) => {
      if (props[propName] == null) {
        return null;
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
  }).isRequired,
} as any;

const MemoizedInnerSelectOptionText = React.memo(InnerSelectOptionText);
/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectOptionText API](https://base-ui.com/components/react-select/#api-reference-SelectOptionText)
 */
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
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}

SelectOptionText.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { SelectOptionText };
