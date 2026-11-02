import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import {
  mapCheckedStateAttribute,
  transitionStatusMapping,
} from '../../internals/stateAttributesMapping';

export const itemMapping: StateAttributesMapping<{ checked: boolean }> = {
  checked: mapCheckedStateAttribute,
  ...transitionStatusMapping,
};
