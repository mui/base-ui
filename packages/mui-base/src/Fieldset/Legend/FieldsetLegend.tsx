'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldsetLegend } from './useFieldsetLegend';
import { useFieldsetRootContext } from '../Root/FieldsetRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Renders an element that labels the fieldset.
 *
 * Demos:
 *
 * - [Fieldset](https://base-ui.netlify.app/components/react-fieldset/)
 *
 * API:
 *
 * - [FieldsetLegend API](https://base-ui.netlify.app/components/react-fieldset/#api-reference-FieldsetLegend)
 */
const FieldsetLegend = React.forwardRef(function FieldsetLegend(
  props: FieldsetLegend.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id, ...otherProps } = props;

  const { getLegendProps } = useFieldsetLegend({ id });

  const { disabled } = useFieldsetRootContext();

  const ownerState: FieldsetLegend.OwnerState = React.useMemo(
    () => ({
      disabled: disabled ?? false,
    }),
    [disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getLegendProps,
    ref: forwardedRef,
    render: render ?? 'span',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace FieldsetLegend {
  export type OwnerState = {
    disabled: boolean;
  };

  export type Props = BaseUIComponentProps<'span', OwnerState> & {};
}

FieldsetLegend.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldsetLegend };
