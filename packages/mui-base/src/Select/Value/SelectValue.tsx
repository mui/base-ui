'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectValue API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectValue)
 */
const SelectValue = React.forwardRef(function SelectValue(
  props: SelectValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, placeholder, ...otherProps } = props;

  const { label, valueRef } = useSelectRootContext();

  const mergedRef = useForkRef(forwardedRef, valueRef);

  const ownerState: SelectValue.OwnerState = React.useMemo(() => ({}), []);

  const getValueProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        children: typeof children === 'function' ? children(label) : label || placeholder,
      }),
    [children, label, placeholder],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectValue {
  export interface OwnerState {}
  export interface Props extends Omit<BaseUIComponentProps<'span', OwnerState>, 'children'> {
    children?: null | ((value: string) => React.ReactNode);
    /**
     * The placeholder value to display when the value is empty (such as during SSR).
     */
    placeholder?: string;
  }
}

SelectValue.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.func,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The placeholder value to display when the value is empty (such as during SSR).
   */
  placeholder: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectValue };
