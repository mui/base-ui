'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldMessageOwnerState, FieldMessageProps } from './FieldMessage.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldMessage } from './useFieldMessage';
import { STYLE_HOOK_MAPPING } from '../utils/constants';

/**
 * A message for the field's control.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldMessage API](https://mui.com/base-ui/react-field/components-api/#field-message)
 */
const FieldMessage = React.forwardRef(function FieldMessage(
  props: FieldMessageProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id, className, show: showProp, ...otherProps } = props;

  const { validityData, disabled = false } = useFieldRootContext();

  const rendered = showProp ? validityData.validityState[showProp] : true;

  const { getMessageProps } = useFieldMessage({ id, rendered });

  const ownerState: FieldMessageOwnerState = React.useMemo(
    () => ({
      disabled,
      valid: validityData.validityState.valid,
    }),
    [disabled, validityData.validityState.valid],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getMessageProps,
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
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
  show: PropTypes.oneOf([
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
} as any;

export { FieldMessage };
