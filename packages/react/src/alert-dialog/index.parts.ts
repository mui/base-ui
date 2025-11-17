import { DialogHandle } from '../dialog/store/DialogHandle';
import { DialogStore } from '../dialog/store/DialogStore';

export { AlertDialogRoot as Root } from './root/AlertDialogRoot';
export { DialogBackdrop as Backdrop } from '../dialog/backdrop/DialogBackdrop';
export { DialogClose as Close } from '../dialog/close/DialogClose';
export { DialogDescription as Description } from '../dialog/description/DialogDescription';
export { DialogPopup as Popup } from '../dialog/popup/DialogPopup';
export { DialogPortal as Portal } from '../dialog/portal/DialogPortal';
export { DialogTitle as Title } from '../dialog/title/DialogTitle';
export { DialogTrigger as Trigger } from '../dialog/trigger/DialogTrigger';
export { DialogViewport as Viewport } from '../dialog/viewport/DialogViewport';

export function createHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>(
    new DialogStore<Payload>({
      modal: true,
      disablePointerDismissal: true,
      role: 'alertdialog',
    }),
  );
}
