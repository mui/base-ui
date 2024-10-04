'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import type { FieldValidityProps, FieldValidityState } from './FieldValidity.types';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';

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
const FieldValidity: React.FC<FieldValidityProps> = function FieldValidity(
  props: FieldValidityProps,
) {
  const { validityData, invalid } = useFieldRootContext(false);

  const fieldValidityState: FieldValidityState = React.useMemo(() => {
    const combinedFieldValidityData = getCombinedFieldValidityData(validityData, invalid);
    return {
      ...combinedFieldValidityData,
      validity: combinedFieldValidityData.state,
    };
  }, [validityData, invalid]);

  return <React.Fragment>{props.children(fieldValidityState)}</React.Fragment>;
};

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
