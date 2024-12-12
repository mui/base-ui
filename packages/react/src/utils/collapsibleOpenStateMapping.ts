import type { CustomStyleHookMapping } from './getStyleHookProps';

const PANEL_OPEN_HOOK = {
  'data-open': '',
};

const PANEL_CLOSED_HOOK = {
  'data-closed': '',
};

export const triggerOpenStateMapping: CustomStyleHookMapping<{
  open: boolean;
}> = {
  open(value) {
    if (value) {
      return {
        'data-panel-open': '',
      };
    }
    return null;
  },
};

export const collapsibleOpenStateMapping = {
  open(value) {
    if (value) {
      return PANEL_OPEN_HOOK;
    }
    return PANEL_CLOSED_HOOK;
  },
} satisfies CustomStyleHookMapping<{
  open: boolean;
}>;
