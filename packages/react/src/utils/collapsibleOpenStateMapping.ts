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

export const collapsibleOpenStateMapping: CustomStyleHookMapping<{
  open: boolean;
  hidden: boolean;
}> = {
  open(value) {
    if (value) {
      return {
        'data-open': '',
      };
    }
    return null;
  },
  hidden(value) {
    if (value) {
      return { 'data-closed': '' };
    }
    return null;
  },
};
