import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { ProgressRootOwnerState } from './ProgressRoot.types';

export const progressStyleHookMapping: CustomStyleHookMapping<ProgressRootOwnerState> = {
  direction: () => null,
  max: () => null,
  min: () => null,
};
