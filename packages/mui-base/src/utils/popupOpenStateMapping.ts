import type { CustomStyleHookMapping } from './getStyleHookProps';

export const triggerOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value: boolean): Record<string, string> {
    if (value) {
      return {
        'data-popup-open': '',
      };
    }
    return {};
  },
};

export const popupOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value: boolean): Record<string, string> {
    if (value) {
      return {
        'data-open': '',
      };
    }
    return {};
  },
};
