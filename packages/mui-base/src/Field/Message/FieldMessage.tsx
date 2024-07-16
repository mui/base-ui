'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldMessageProps } from './FieldMessage.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldMessage } from './useFieldMessage';

/**
 * A message for the field's control.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldMessage API](https://mui.com/base-ui/react-field/components-api/#field-description)
 */
const FieldMessage = React.forwardRef(function FieldMessage(
  props: FieldMessageProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id, className, show, ...otherProps } = props;

  const { validityData } = useFieldRootContext();

  let rendered = show == null;
  if (typeof show === 'string' && validityData.validityState[show]) {
    rendered = true;
  }
  if (typeof show === 'function' && show(validityData.value)) {
    rendered = true;
  }

  const { getMessageProps } = useFieldMessage({ id, rendered });

  const { renderElement } = useComponentRenderer({
    propGetter: getMessageProps,
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    ownerState: {},
    extraProps: otherProps,
  });

  if (!rendered) {
    return null;
  }

  return renderElement();
});

FieldMessage.propTypes /* remove-proptypes */ = {
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
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  show: PropTypes.oneOfType([
    PropTypes.oneOf([
      'badInput',
      'customError',
      'patternMismatch',
      'rangeOverflow',
      'rangeUnderflow',
      'stepMismatch',
      'tooLong',
      'tooShort',
      'typeMismatch',
      'valid',
      'valueMissing',
    ]),
    PropTypes.func,
  ]),
} as any;

export { FieldMessage };
