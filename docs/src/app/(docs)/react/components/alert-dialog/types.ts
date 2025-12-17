import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, AlertDialog);

export const TypesAlertDialogRoot = types.Root;
export const TypesAlertDialogTrigger = types.Trigger;
export const TypesAlertDialogPortal = types.Portal;
export const TypesAlertDialogBackdrop = types.Backdrop;
export const TypesAlertDialogViewport = types.Viewport;
export const TypesAlertDialogPopup = types.Popup;
export const TypesAlertDialogTitle = types.Title;
export const TypesAlertDialogDescription = types.Description;
export const TypesAlertDialogClose = types.Close;
