import type { CustomStyleHookMapping } from './getStyleHookProps';
import { CollapsiblePanelDataAttributes } from '../collapsible/panel/CollapsiblePanelDataAttributes';
import { CollapsibleTriggerDataAttributes } from '../collapsible/trigger/CollapsibleTriggerDataAttributes';

const PANEL_OPEN_HOOK = {
  [CollapsiblePanelDataAttributes.open]: '',
};

const PANEL_CLOSED_HOOK = {
  [CollapsiblePanelDataAttributes.closed]: '',
};

export const triggerOpenStateMapping: CustomStyleHookMapping<{
  open: boolean;
}> = {
  open(value) {
    if (value) {
      return {
        [CollapsibleTriggerDataAttributes.panelOpen]: '',
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
