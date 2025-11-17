import { DialogHandle } from '../dialog/store/DialogHandle';
import { DialogStore } from '../dialog/store/DialogStore';

export { AlertDialogBackdrop as Backdrop } from './backdrop/AlertDialogBackdrop';
export { AlertDialogClose as Close } from './close/AlertDialogClose';
export { AlertDialogDescription as Description } from './description/AlertDialogDescription';
export { AlertDialogPopup as Popup } from './popup/AlertDialogPopup';
export { AlertDialogPortal as Portal } from './portal/AlertDialogPortal';
export { AlertDialogRoot as Root } from './root/AlertDialogRoot';
export { AlertDialogViewport as Viewport } from './viewport/AlertDialogViewport';
export { AlertDialogTitle as Title } from './title/AlertDialogTitle';
export { AlertDialogTrigger as Trigger } from './trigger/AlertDialogTrigger';

export function createHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>(
    new DialogStore<Payload>({
      modal: true,
      disablePointerDismissal: true,
    }),
  );
}
