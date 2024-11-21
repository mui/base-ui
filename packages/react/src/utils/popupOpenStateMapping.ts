import type { CustomStyleHookMapping } from './getStyleHookProps';

const TRIGGER_HOOK = {
  'data-popup-open': '',
};

const PRESSABLE_TRIGGER_HOOK = {
  'data-popup-open': '',
  'data-pressed': '',
};

const POPUP_HOOK = {
  'data-open': '',
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

export const popupOpenStateMapping = {
  open(value) {
    if (value) {
      return POPUP_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ open: boolean }>;
