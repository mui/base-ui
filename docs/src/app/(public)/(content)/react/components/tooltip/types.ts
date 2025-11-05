import { Tooltip } from '@base-ui-components/react/tooltip';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Tooltip);

export const TypesTooltipProvider = types.Provider;
export const TypesTooltipRoot = types.Root;
export const TypesTooltipTrigger = types.Trigger;
export const TypesTooltipPortal = types.Portal;
export const TypesTooltipPositioner = types.Positioner;
export const TypesTooltipPopup = types.Popup;
export const TypesTooltipArrow = types.Arrow;
