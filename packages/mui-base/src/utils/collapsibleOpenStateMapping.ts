import type { CustomStyleHookMapping } from './getStyleHookProps';

export const triggerOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value) {
    if (value) {
      return {
        'data-panel-open': '',
      };
    }
    return null;
  },
};

export const collapsibleOpenStateMapping: CustomStyleHookMapping<{ open: boolean }> = {
  open(value) {
    if (value) {
      return {
        'data-open': '',
      };
    }
    return null;
  },
};
