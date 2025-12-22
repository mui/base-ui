import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CollapsibleRoot } from './CollapsibleRoot';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';

export const collapsibleStateAttributesMapping: StateAttributesMapping<CollapsibleRoot.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};
