import type { CustomStyleHookMapping } from './getStyleHookProps';

export const triggerOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value) {
    if (value) {
      return {
        'data-popup-open': '',
      };
    }
    return null;
  },
};

export const popupOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value) {
    if (value) {
      return {
        'data-open': '',
      };
    }
    return null;
  },
};
