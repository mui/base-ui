import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import { transitionStatusMapping } from '../internals/stateAttributesMapping';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import * as CommonPopupDataAttributes from './CommonPopupDataAttributes';
import * as CommonTriggerDataAttributes from './CommonTriggerDataAttributes';

export { CommonPopupDataAttributes, CommonTriggerDataAttributes };

const TRIGGER_HOOK = {
  [CommonTriggerDataAttributes.popupOpen]: '',
};

const PRESSABLE_TRIGGER_HOOK = {
  [CommonTriggerDataAttributes.popupOpen]: '',
  [CommonTriggerDataAttributes.pressed]: '',
};

const POPUP_OPEN_HOOK = {
  [CommonPopupDataAttributes.open]: '',
};

const POPUP_CLOSED_HOOK = {
  [CommonPopupDataAttributes.closed]: '',
};

const ANCHOR_HIDDEN_HOOK = {
  [CommonPopupDataAttributes.anchorHidden]: '',
};

export const triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return TRIGGER_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean }>;

export const pressableTriggerOpenStateMapping = {
  open(value) {
    if (value) {
      return PRESSABLE_TRIGGER_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean }>;

export const popupStateMapping = {
  open(value) {
    if (value) {
      return POPUP_OPEN_HOOK;
    }
    return POPUP_CLOSED_HOOK;
  },
  anchorHidden(value) {
    if (value) {
      return ANCHOR_HIDDEN_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean; anchorHidden: boolean }>;

export const popupTransitionStateMapping = {
  ...popupStateMapping,
  ...transitionStatusMapping,
} satisfies StateAttributesMapping<{
  open: boolean;
  anchorHidden: boolean;
  transitionStatus: TransitionStatus;
}>;
