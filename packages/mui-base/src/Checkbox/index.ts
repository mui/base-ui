'use client';
export { CheckboxRoot as Root } from './Root/CheckboxRoot';
export { useCheckboxRoot } from './Root/useCheckboxRoot';
export { CheckboxContext } from './Root/CheckboxContext';
export type {
  CheckboxRootProps as RootProps,
  CheckboxRootOwnerState as OwnerState,
  CheckboxContextValue,
  UseCheckboxRootParameters,
  UseCheckboxRootReturnValue,
} from './Root/CheckboxRoot.types';

export { CheckboxIndicator as Indicator } from './Indicator/CheckboxIndicator';
export type { CheckboxIndicatorProps as IndicatorProps } from './Indicator/CheckboxIndicator.types';
