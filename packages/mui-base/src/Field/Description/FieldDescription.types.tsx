import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldDescriptionOwnerState = FieldRootOwnerState;

export interface FieldDescriptionProps
  extends BaseUIComponentProps<'p', FieldDescriptionOwnerState> {}
