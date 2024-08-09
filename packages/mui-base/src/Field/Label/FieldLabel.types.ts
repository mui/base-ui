import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldLabelOwnerState = FieldRootOwnerState;

export interface FieldLabelProps extends BaseUIComponentProps<'div', FieldLabelOwnerState> {}
