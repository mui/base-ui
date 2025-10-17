import { Dialog } from '@base-ui-components/react/dialog';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Dialog);

export const TypesDialogRoot = types.Root;
export const TypesDialogTrigger = types.Trigger;
export const TypesDialogPortal = types.Portal;
export const TypesDialogBackdrop = types.Backdrop;
export const TypesDialogPopup = types.Popup;
export const TypesDialogTitle = types.Title;
export const TypesDialogDescription = types.Description;
export const TypesDialogClose = types.Close;
