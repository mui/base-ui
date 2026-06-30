import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { DialogStore, createNullDialogStore, type DialogHandleStore } from './DialogStore';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

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
   * Inert, closed store handed to detached triggers while no root is attached, so they can render
   * and register without a mounted root. Its reads always reflect a closed dialog and its mutations
   * are no-ops. Triggers register into whichever store `store` currently resolves to, so while
   * detached they live in this store's trigger map and migrate themselves to the root's store (and
   * back) as it attaches/detaches.
   */
  private readonly fallbackStore = createNullDialogStore<Payload>();

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
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: DialogHandle.open() was called while no root using this handle is mounted. ' +
            'The call was ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    // While a root is attached, registered triggers live in its store, so resolve the trigger from there.
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
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' +
            'The call and its payload were ignored; mount a root with this handle before opening it imperatively.',
        );
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: DialogHandle.close() was called while no root using this handle is mounted. ' +
            'The call was ignored.',
        );
      }
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
   * Points the handle at a root's store and notifies subscribers so detached triggers re-render and
   * re-register into it (their registration ref re-fires on the store-pointer change). Returns a
   * cleanup function that detaches the store again. Called by `Dialog.Root`.
   * @internal
   */
  attachStore(newStore: DialogStore<Payload>) {
    if (this.attachedStore !== newStore) {
      this.attachedStore = newStore;
      this.notifyStoreListeners();
    }

    if (process.env.NODE_ENV !== 'production') {
      // The overlap bookkeeping only exists in development; the fields are created lazily so they
      // never appear on instances in production (like `controlledValues` in `ReactStore`).
      const dev = this as any;
      dev.attachedRootCount = (dev.attachedRootCount ?? 0) + 1;
      if (dev.attachedRootCount > 1) {
        // More than one root is attached at once. This is usually a transient overlap during an
        // animated route transition, where the outgoing root unmounts a frame after the incoming
        // one mounts. Defer the check by a frame so a clean handoff doesn't warn, and only warn if
        // the overlap is still present once the transition has settled (the previous root didn't
        // unmount).
        (dev.overlapWarningFrame ??= AnimationFrame.create()).request(() => {
          if (dev.attachedRootCount > 1) {
            console.warn(
              'Base UI: A handle is attached to more than one mounted root at the same time. ' +
                'The most recently mounted root takes over and the previous one stops being controlled by the handle. ' +
                'A handle should be used by a single root that stays mounted for the lifetime of the handle.',
            );
          }
        });
      }
    }

    return () => {
      if (process.env.NODE_ENV !== 'production') {
        (this as any).attachedRootCount -= 1;
      }
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
