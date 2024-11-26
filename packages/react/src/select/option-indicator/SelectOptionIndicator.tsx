'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSelectOptionContext } from '../option/SelectOptionContext';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectOptionIndicator API](https://base-ui.com/components/react-select/#api-reference-SelectOptionIndicator)
 */
const SelectOptionIndicator = React.forwardRef(function SelectOptionIndicator(
  props: SelectOptionIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const { selected } = useSelectOptionContext();

  const getOptionProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-hidden': true,
        children: '✔️',
      }),
    [],
  );

  const state: SelectOptionIndicator.State = React.useMemo(
    () => ({
      selected,
    }),
    [selected],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getOptionProps,
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
  });

  const shouldRender = selected || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectOptionIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    children?: React.ReactNode;
    /**
     * If `true`, the item indicator remains mounted when the item is not
     * selected.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    selected: boolean;
  }
}

SelectOptionIndicator.propTypes /* remove-proptypes */ = {
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
   * If `true`, the item indicator remains mounted when the item is not
   * selected.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectOptionIndicator };
