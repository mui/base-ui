'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../Root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { NumberFieldRoot } from '../Root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Groups interactive `NumberField` components together.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldGroup API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldGroup)
 */
const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  props: NumberFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getGroupProps, ownerState } = useNumberFieldRootContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getGroupProps,
    ref: forwardedRef,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldGroup {
  export interface OwnerState extends NumberFieldRoot.OwnerState {}
  export type Props = BaseUIComponentProps<'div', OwnerState> & {};
}

NumberFieldGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldGroup };
