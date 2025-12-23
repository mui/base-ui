import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { Side } from '../../utils/useAnchorPositioning';
import { fieldValidityMapping } from '../../field/utils/constants';

export const triggerStateAttributesMapping = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  popupSide: (side: Side | null) => (side ? { 'data-popup-side': side } : null),
  listEmpty: (empty: boolean) => (empty ? { 'data-list-empty': '' } : null),
  itemHighlighted: (highlighted: boolean) => (highlighted ? { 'data-item-highlighted': '' } : null),
} satisfies StateAttributesMapping<{
  open: boolean;
  valid: boolean | null;
  popupSide: Side | null;
  listEmpty: boolean;
  itemHighlighted: boolean;
}>;
