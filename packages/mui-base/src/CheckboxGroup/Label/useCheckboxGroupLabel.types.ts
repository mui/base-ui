import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseCheckboxGroupLabelParameters {
  /**
   * The id of the label.
   */
  id: string | undefined;
  /**
   * Set the id of the label.
   */
  setId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export interface UseCheckboxGroupLabelReturnValue {
  /**
   * Props to apply to the label element.
   */
  getLabelProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
