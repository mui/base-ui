import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CollapsibleRoot } from './CollapsibleRoot';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';

export const collapsibleMapping: StateAttributesMapping<CollapsibleRoot.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};
