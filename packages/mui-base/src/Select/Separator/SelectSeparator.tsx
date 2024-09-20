'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectSeparator API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectSeparator)
 */
const SelectSeparator = React.forwardRef(function SelectSeparator(
  props: SelectSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const ownerState: SelectSeparator.OwnerState = React.useMemo(() => ({}), []);

  const getSeparatorProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        role: 'separator',
        'aria-hidden': true,
      }),
    [],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSeparatorProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

SelectSeparator.propTypes /* remove-proptypes */ = {
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

namespace SelectSeparator {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

export { SelectSeparator };
