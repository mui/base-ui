import type { DialogStore, DialogHandleStore } from './DialogStore';
import { createNullDialogStore } from './DialogStore';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a Dialog imperatively and associates detached `Dialog.Trigger` components with a
 * `Dialog.Root`. Create one with `Dialog.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class DialogHandle<Payload> extends BasePopupHandle<
  DialogHandleStore<Payload>,
  DialogStore<Payload>,
  string | null
> {
  constructor() {
    super(createNullDialogStore<Payload>(), 'Dialog', false);
  }

  /**
   * Opens the dialog with the given payload, without associating it with any trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param payload Payload to set when opening the dialog. It is exposed to the root's render-prop children.
   */
  openWithPayload(payload: Payload) {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' +
            'The call and its payload were ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    attachedStore.set('payload', payload);
    attachedStore.setOpen(true, createChangeEventDetails(REASONS.imperativeAction));
  }
}

/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 */
export function createDialogHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>();
}
