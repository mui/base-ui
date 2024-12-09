import type { CustomStyleHookMapping } from './getStyleHookProps';

const TRIGGER_HOOK = {
  'data-popup-open': '',
};

const PRESSABLE_TRIGGER_HOOK = {
  'data-popup-open': '',
  'data-pressed': '',
};

const POPUP_OPEN_HOOK = {
  'data-open': '',
};

const POPUP_CLOSED_HOOK = {
  'data-closed': '',
};

const ANCHOR_HIDDEN_HOOK = {
  'data-anchor-hidden': '',
};

export const triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return TRIGGER_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ open: boolean }>;

export const pressableTriggerOpenStateMapping = {
  open(value) {
    if (value) {
      return PRESSABLE_TRIGGER_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ open: boolean }>;

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
} satisfies CustomStyleHookMapping<{ open: boolean; anchorHidden: boolean }>;
