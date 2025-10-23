import { DialogStore } from './DialogStore';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * A handle to control a Dialog imperatively and to associate detached triggers with it.
 */
export class DialogHandle<Payload> {
  /**
   * Internal store holding the dialog state.
   * @internal
   */
  public readonly store: DialogStore<Payload>;

  constructor() {
    this.store = new DialogStore<Payload>();
  }

  /**
   * Opens the dialog and associates it with the trigger with the given id.
   * The trigger, if provided, must be a Dialog.Trigger component with this handle passed as a prop.
   *
   * @param triggerId ID of the trigger to associate with the dialog. If null, the dialog will open without a trigger association.
   */
  open(triggerId: string | null) {
    const triggerElement = triggerId
      ? (this.store.state.triggers.get(triggerId) ?? undefined)
      : undefined;

    if (process.env.NODE_ENV !== 'production' && triggerId && !triggerElement) {
      console.warn(
        `Base UI: DialogHandle.open: No trigger found with id "${triggerId}". The dialog will open, but the trigger will not be associated with the dialog.`,
      );
    }

    this.store.setOpen(
      true,
      createChangeEventDetails('imperative-action', undefined, triggerElement),
    );
  }

  /**
   * Opens the dialog and sets the payload.
   * Does not associate the dialog with any trigger.
   *
   * @param payload Payload to set when opening the dialog.
   */
  openWithPayload(payload: Payload) {
    this.store.set('payload', payload);
    this.store.setOpen(true, createChangeEventDetails('imperative-action', undefined, undefined));
  }

  /**
   * Closes the dialog.
   */
  close() {
    this.store.setOpen(false, createChangeEventDetails('imperative-action', undefined, undefined));
  }

  /**
   * Indicates whether the dialog is currently open.
   */
  get isOpen() {
    return this.store.state.open;
  }
}

/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 */
export function createDialogHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>();
}
