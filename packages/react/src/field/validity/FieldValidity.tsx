'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFieldRootContext } from '../root/FieldRootContext';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';
import { FieldValidityData } from '../root/FieldRoot';

/**
 * Used to display a custom message based on the field’s validity.
 * Requires `children` to be a function that accepts field validity state as an argument.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldValidity: React.FC<FieldValidity.Props> = function FieldValidity(props) {
  const { children } = props;
  const { validityData, invalid } = useFieldRootContext(false);

  const fieldValidityState: FieldValidityState = React.useMemo(() => {
    const combinedFieldValidityData = getCombinedFieldValidityData(validityData, invalid);
    return {
      ...combinedFieldValidityData,
      validity: combinedFieldValidityData.state,
    };
  }, [validityData, invalid]);

  return <React.Fragment>{children(fieldValidityState)}</React.Fragment>;
};

export interface FieldValidityState extends Omit<FieldValidityData, 'state'> {
  validity: FieldValidityData['state'];
}

namespace FieldValidity {
  export interface State {}

  export interface Props {
    /**
     * A function that accepts the field validity state as an argument.
     *
     * ```jsx
     * <Field.Validity>
     *   {(validity) => {
     *     return <div>...</div>
     *   }}
     * </Field.Validity>
     * ```
     */
    children: (state: FieldValidityState) => React.ReactNode;
  }
}

FieldValidity.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A function that accepts the field validity state as an argument.
   *
   * ```jsx
   * <Field.Validity>
   *   {(validity) => {
   *     return <div>...</div>
   *   }}
   * </Field.Validity>
   * ```
   */
  children: PropTypes.func.isRequired,
} as any;

export { FieldValidity };
