'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { useComponentRenderer } from '../../utils/useRenderElement';
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

InnerSelectItemText.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  indexRef: PropTypes.shape({
    current: PropTypes.number.isRequired,
  }).isRequired,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  selected: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  selectedItemTextRef: PropTypes.shape({
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

SelectItemText.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectItemText };
