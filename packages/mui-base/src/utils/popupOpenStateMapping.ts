import type { CustomStyleHookMapping } from './getStyleHookProps';

const TRIGGER_HOOK = {
  'data-popup-open': '',
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

export const popupOpenStateMapping = {
  open(value) {
    if (value) {
      return POPUP_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ open: boolean }>;
