import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CollapsibleRootState } from './CollapsibleRoot';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';

export const collapsibleStateAttributesMapping: StateAttributesMapping<CollapsibleRootState> = {
  ...baseMapping,
  ...transitionStatusMapping,
};
