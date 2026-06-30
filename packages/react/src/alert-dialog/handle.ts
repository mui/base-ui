import { DialogHandle } from '../dialog/store/DialogHandle';

/**
 * Controls an Alert Dialog imperatively and associates detached `AlertDialog.Trigger` components with
 * an `AlertDialog.Root`. Create one with `AlertDialog.createHandle()` and pass it to the `handle`
 * prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class AlertDialogHandle<Payload> extends DialogHandle<Payload> {
  // Nominal brand: makes this handle type distinct from `DialogHandle` and sibling handles so they
  // can't be passed interchangeably. Type-only; has no runtime presence.
  private readonly __alertDialogBrand!: never;
}

/**
 * Creates a new handle to connect an AlertDialog.Root with detached AlertDialog.Trigger components.
 */
export function createAlertDialogHandle<Payload>(): AlertDialogHandle<Payload> {
  return new AlertDialogHandle<Payload>();
}
