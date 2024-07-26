'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import type { FieldValidityOwnerState, FieldValidityProps } from './FieldValidity.types';

/**
 * Render prop component that provides the field's validity state and value to its children.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldValidity API](https://mui.com/base-ui/react-field/components-api/#field-validity)
 */
function FieldValidity(props: FieldValidityProps) {
  const { validityData, disabled = false } = useFieldRootContext();

  const ownerState: FieldValidityOwnerState = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  return (
    <React.Fragment>
      {props.children(
        {
          value: validityData.value,
          validity: validityData.state,
        },
        ownerState,
      )}
    </React.Fragment>
  );
}

FieldValidity.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.func.isRequired,
} as any;

export { FieldValidity };
