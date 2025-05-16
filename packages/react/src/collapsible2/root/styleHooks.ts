import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CollapsibleRoot } from './CollapsibleRoot';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRoot.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};
