'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 */
const SelectIcon = React.forwardRef(function SelectIcon(
  props: SelectIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const state: SelectIcon.State = React.useMemo(() => ({}), []);

  const getIconProps = React.useCallback((externalProps: React.ComponentProps<'span'>) => {
    return mergeReactProps(externalProps, {
      'aria-hidden': true,
      children: '▼',
    });
  }, []);

  const { renderElement } = useComponentRenderer({
    propGetter: getIconProps,
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}

SelectIcon.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectIcon };
