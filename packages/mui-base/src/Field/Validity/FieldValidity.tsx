'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';
import { FieldValidityData } from '../Root/FieldRoot';

/**
 * Render prop component that provides the field's validity state and value to its children.
 *
 * Demos:
 *
 * - [Field](https://base-ui.netlify.app/components/react-field/)
 *
 * API:
 *
 * - [FieldValidity API](https://base-ui.netlify.app/components/react-field/#api-reference-FieldValidity)
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
  export interface OwnerState {}

  export interface Props {
    children: (state: FieldValidityState) => React.ReactNode;
  }
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
