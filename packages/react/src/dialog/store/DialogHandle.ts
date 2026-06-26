import { DialogStore, NullDialogStore, type DialogHandleStore } from './DialogStore';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PopupTriggerMap } from '../../utils/popups';

/**
 * Controls a Dialog imperatively and associates detached `Dialog.Trigger` components with a
 * `Dialog.Root`. Create one with `Dialog.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class DialogHandle<Payload> {
  /**
   * Trigger registrations captured while no root store is attached. Detached triggers register here
   * (through the fallback store) and the entries are drained into the real store when a root attaches.
   */
  private readonly pendingTriggerRegistrations = new PopupTriggerMap();

  /**
   * Inert, closed store handed to detached triggers while no root is attached, so they can render
   * and register without a mounted root. Backed by `pendingTriggerRegistrations`.
   */
  private readonly fallbackStore = new NullDialogStore<Payload>(this.pendingTriggerRegistrations);

  /**
   * Store owned by the currently mounted root, or `null` when no root is attached. Imperative
   * methods are no-ops while this is `null`.
   */
  private attachedStore: DialogStore<Payload> | null = null;

  /**
   * Listeners notified when `attachedStore` changes, so detached triggers can follow the store pointer.
   */
  private readonly storeListeners = new Set<() => void>();

  /**
   * Opens the dialog, optionally associating it with a trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the dialog. The trigger must be a matching
   * `Dialog.Trigger` with this handle passed as a prop. Pass `null` to open without associating any trigger.
   */
  open(triggerId: string | null) {
    if (this.attachedStore === null) {
      return;
    }

    // While a root is attached, registered triggers live in its store (the pending buffer is empty).
    const triggerElement = triggerId
      ? (this.attachedStore.context.triggerElements.getById(triggerId) as HTMLElement | undefined)
      : undefined;

    if (process.env.NODE_ENV !== 'production') {
      if (triggerId && !triggerElement) {
        console.warn(
          `Base UI: DialogHandle.open: No trigger found with id "${triggerId}". The dialog will open, but the trigger will not be associated with the dialog.`,
        );
      }
    }

    this.attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Opens the dialog with the given payload, without associating it with any trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param payload Payload to set when opening the dialog. It is exposed to the root's render-prop children.
   */
  openWithPayload(payload: Payload) {
    if (this.attachedStore === null) {
      return;
    }

    this.attachedStore.set('payload', payload);
    this.attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, undefined),
    );
  }

  /**
   * Closes the dialog.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    if (this.attachedStore === null) {
      return;
    }

    this.attachedStore.setOpen(
      false,
      createChangeEventDetails(REASONS.imperativeAction, undefined, undefined),
    );
  }

  /**
   * Whether the dialog is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }

  /**
   * Store that detached triggers read from: the attached root's store, or an inert fallback store
   * used while no root is attached.
   * @internal
   */
  get store(): DialogHandleStore<Payload> {
    return this.attachedStore ?? this.fallbackStore;
  }

  /**
   * Subscribes to changes of the attached store pointer so detached triggers re-render and re-bind
   * when a root attaches or detaches. Returns a function that removes the listener.
   * @internal
   */
  subscribeStore(listener: () => void) {
    this.storeListeners.add(listener);

    return () => {
      this.storeListeners.delete(listener);
    };
  }

  /**
   * Attaches a root's store to this handle and drains any trigger registrations captured while
   * detached into it. Returns a cleanup function that detaches the store again. Called by `Dialog.Root`.
   * @internal
   */
  attachStore(newStore: DialogStore<Payload>) {
    const previousStore = this.attachedStore;

    if (previousStore !== newStore) {
      this.attachedStore = newStore;

      // Triggers that mounted before this root registered into the pending buffer (via the fallback
      // store). Their registration ref is a stable callback that does not re-fire when the store
      // pointer swaps, so draining here is the only path that moves them into the attached store.
      // Do it before notifying subscribers so the store is immediately consistent for its
      // trigger-derived logic (e.g. resolving an imperative `open(triggerId)` or the active trigger).
      const { triggerElements } = newStore.context;
      for (const [id, element] of this.pendingTriggerRegistrations.entries()) {
        triggerElements.add(id, element);
      }
      this.pendingTriggerRegistrations.clear();

      newStore.set('triggerCount', triggerElements.size);
      this.notifyStoreListeners();
    }

    return () => {
      if (this.attachedStore === newStore) {
        this.attachedStore = null;
        this.notifyStoreListeners();
      }
    };
  }

  /**
   * Notifies subscribers that the attached store pointer changed.
   */
  private notifyStoreListeners() {
    this.storeListeners.forEach((listener) => {
      listener();
    });
  }
}

/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 */
export function createDialogHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>();
}
