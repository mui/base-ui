export * as AlertDialog from './index.parts';

export type * from './root/AlertDialogRoot';

export type {
  DialogBackdropProps as AlertDialogBackdropProps,
  DialogBackdropState as AlertDialogBackdropState,
} from '../dialog/backdrop/DialogBackdrop';
export type {
  DialogCloseProps as AlertDialogCloseProps,
  DialogCloseState as AlertDialogCloseState,
} from '../dialog/close/DialogClose';
export type {
  DialogDescriptionProps as AlertDialogDescriptionProps,
  DialogDescriptionState as AlertDialogDescriptionState,
} from '../dialog/description/DialogDescription';
export type {
  DialogPopupProps as AlertDialogPopupProps,
  DialogPopupState as AlertDialogPopupState,
} from '../dialog/popup/DialogPopup';
export type {
  DialogPortalProps as AlertDialogPortalProps,
  DialogPortalState as AlertDialogPortalState,
} from '../dialog/portal/DialogPortal';
export type {
  DialogTitleProps as AlertDialogTitleProps,
  DialogTitleState as AlertDialogTitleState,
} from '../dialog/title/DialogTitle';
export type * from './trigger/AlertDialogTrigger';
export type {
  DialogViewportProps as AlertDialogViewportProps,
  DialogViewportState as AlertDialogViewportState,
} from '../dialog/viewport/DialogViewport';

export * as AlertDialogBackdropDataAttributes from '../dialog/backdrop/DialogBackdropDataAttributes';
export * as AlertDialogCloseDataAttributes from '../dialog/close/DialogCloseDataAttributes';
export * as AlertDialogPopupCssVars from '../dialog/popup/DialogPopupCssVars';
export * as AlertDialogPopupDataAttributes from '../dialog/popup/DialogPopupDataAttributes';
export * as AlertDialogTriggerDataAttributes from './trigger/AlertDialogTriggerDataAttributes';
export * as AlertDialogViewportDataAttributes from '../dialog/viewport/DialogViewportDataAttributes';
