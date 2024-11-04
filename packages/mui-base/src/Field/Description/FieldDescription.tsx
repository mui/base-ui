'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../Root/FieldRoot';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldDescription } from './useFieldDescription';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A description message for the field's control.
 *
 * Demos:
 *
 * - [Field](https://base-ui.netlify.app/components/react-field/)
 *
 * API:
 *
 * - [FieldDescription API](https://base-ui.netlify.app/components/react-field/#api-reference-FieldDescription)
 */
const FieldDescription = React.forwardRef(function FieldDescription(
  props: FieldDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id, className, ...otherProps } = props;

  const { ownerState } = useFieldRootContext(false);

  const { getDescriptionProps } = useFieldDescription({ id });

  const { renderElement } = useComponentRenderer({
    propGetter: getDescriptionProps,
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldDescription {
  export type OwnerState = FieldRoot.OwnerState;

  export type Props = BaseUIComponentProps<'p', OwnerState> & {};
}

FieldDescription.propTypes /* remove-proptypes */ = {
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

export { FieldDescription };
