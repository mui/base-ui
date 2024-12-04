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
      return POPUP_OPEN_HOOK;
    }
    return null;
  },
  hidden(value) {
    if (value) {
      return POPUP_CLOSED_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{
  open: boolean;
  hidden: boolean;
}>;
