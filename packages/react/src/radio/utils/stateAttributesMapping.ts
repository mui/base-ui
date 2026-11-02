import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import {
  mapCheckedStateAttribute,
  transitionStatusMapping,
} from '../../internals/stateAttributesMapping';
import { fieldValidityMapping } from '../../internals/field-constants/constants';

export const stateAttributesMapping = {
  checked: mapCheckedStateAttribute,
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies StateAttributesMapping<{
  checked: boolean;
  transitionStatus: TransitionStatus;
  valid: boolean | null;
}>;
