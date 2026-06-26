import { DialogHandle } from '../dialog/store/DialogHandle';

/**
 * A handle to control an Alert Dialog imperatively and to associate detached triggers with it.
 *
 * The imperative methods on the handle require an AlertDialog.Root using the same handle to be mounted.
 * Calls made before the root is attached to the handle are ignored; the root owns fresh state when it mounts.
 */
export class AlertDialogHandle<Payload> extends DialogHandle<Payload> {
  private readonly __alertDialogBrand!: never;
}

/**
 * Creates a new handle to connect an AlertDialog.Root with detached AlertDialog.Trigger components.
 */
export function createAlertDialogHandle<Payload>(): AlertDialogHandle<Payload> {
  return new AlertDialogHandle<Payload>();
}
