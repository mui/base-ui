import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { Side } from '../../internals/useAnchorPositioning';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import * as ComboboxInputDataAttributes from '../input/ComboboxInputDataAttributes';

export const triggerStateAttributesMapping = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  popupSide: (side: Side | null) =>
    side ? { [ComboboxInputDataAttributes.popupSide]: side } : null,
  listEmpty: (empty: boolean) => (empty ? { [ComboboxInputDataAttributes.listEmpty]: '' } : null),
} satisfies StateAttributesMapping<{
  open: boolean;
  valid: boolean | null;
  popupSide: Side | null;
  listEmpty: boolean;
  placeholder: boolean;
}>;
