'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ValidityData, type FieldRootContextValue, type FieldRootProps } from './FieldRoot.types';
import { FieldRootContext } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';

/**
 * The foundation for building custom-styled fields.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldRoot API](https://mui.com/base-ui/react-field/components-api/#field-root)
 */
const FieldRoot = React.forwardRef(function FieldRoot(
  props: FieldRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const [controlId, setControlId] = React.useState<string | undefined>(undefined);
  const [controlElement, setControlElement] = React.useState<Element | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);
  const [validityData, setValidityData] = React.useState<ValidityData>({
    validityState: DEFAULT_VALIDITY_STATE,
    validityMessage: '',
    value: null,
  });

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState: {},
    extraProps: otherProps,
  });

  const contextValue: FieldRootContextValue = React.useMemo(
    () => ({
      controlId,
      setControlId,
      messageIds,
      setMessageIds,
      validityData,
      setValidityData,
      controlElement,
      setControlElement,
    }),
    [controlId, messageIds, validityData, controlElement],
  );

  return (
    <FieldRootContext.Provider value={contextValue}>{renderElement()}</FieldRootContext.Provider>
  );
});

FieldRoot.propTypes /* remove-proptypes */ = {
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

export { FieldRoot };
