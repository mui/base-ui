import { DialogHandle } from '../dialog/store/DialogHandle';
import { DialogStore } from '../dialog/store/DialogStore';

export function createAlertDialogHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>(
    new DialogStore<Payload>({
      modal: true,
      disablePointerDismissal: true,
      role: 'alertdialog',
    }),
  );
}
