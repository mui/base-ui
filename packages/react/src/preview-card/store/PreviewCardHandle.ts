import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  PreviewCardStore,
  createNullPreviewCardStore,
  type PreviewCardHandleStore,
} from './PreviewCardStore';

/**
 * Controls a PreviewCard imperatively and associates detached `PreviewCard.Trigger` components with
 * a `PreviewCard.Root`. Create one with `PreviewCard.createHandle()` and pass it to the `handle`
 * prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class PreviewCardHandle<Payload> {
  /**
   * Inert, closed store handed to detached triggers while no root is attached, so they can render
   * and register without a mounted root. Its reads always reflect a closed preview card and its
   * mutations are no-ops. Triggers register into whichever store `store` currently resolves to, so
   * while detached they live in this store's trigger map and migrate themselves to the root's store
   * (and back) as it attaches/detaches.
   */
  private readonly fallbackStore = createNullPreviewCardStore<Payload>();

  /**
   * Stores of every root currently using this handle, in attach order. A handle is meant to be used
   * by a single mounted root, but roots can transiently overlap (e.g. during an animated route
   * transition), so this stack lets `attachStore`'s cleanup restore the previous root instead of
   * leaving a still-mounted root uncontrollable when a newer overlapping root detaches first.
   */
  private readonly attachedStores: PreviewCardStore<Payload>[] = [];

  /**
   * Store of the root that currently controls the handle: the most recently attached one still
   * mounted, or `null` when no root is attached. Imperative methods are no-ops while this is `null`.
   */
  private attachedStore: PreviewCardStore<Payload> | null = null;

  /**
   * Listeners notified when `attachedStore` changes, so detached triggers can follow the store pointer.
   */
  private readonly storeListeners = new Set<() => void>();

  /**
   * Opens the preview card and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the preview card. The trigger must be a
   * matching `PreviewCard.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string) {
    if (this.attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: PreviewCardHandle.open() was called while no root using this handle is mounted. ' +
            'The call was ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    // Registered triggers normally live in the attached root's store. During the commit in which a
    // root first attaches, a still-mounted detached trigger has not re-registered into the root store
    // yet (it migrates on its next render), but it is still registered in the fallback store. Fall
    // back to that map so an imperative open-by-id (e.g. called from a layout effect in the same
    // commit the root mounts) stays associated with the requested trigger instead of opening
    // unassociated and letting another detached trigger claim the open popup first.
    const triggerElement = triggerId
      ? ((this.attachedStore.context.triggerElements.getById(triggerId) ??
          this.fallbackStore.context.triggerElements.getById(triggerId)) as HTMLElement | undefined)
      : undefined;

    if (process.env.NODE_ENV !== 'production') {
      if (triggerId && !triggerElement) {
        console.warn(
          `Base UI: PreviewCardHandle.open: No trigger found with id "${triggerId}". The preview card will open, but the trigger will not be associated with the preview card.`,
        );
      }
    }

    this.attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Closes the preview card.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    if (this.attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: PreviewCardHandle.close() was called while no root using this handle is mounted. ' +
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
   * Whether the preview card is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }

  /**
   * Store that detached triggers read from: the attached root's store, or an inert fallback store
   * used while no root is attached.
   * @internal
   */
  get store(): PreviewCardHandleStore<Payload> {
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
   * cleanup function that detaches the store again. Called by `PreviewCard.Root`.
   * @internal
   */
  attachStore(newStore: PreviewCardStore<Payload>) {
    this.attachedStores.push(newStore);
    this.setActiveStore(newStore);

    if (process.env.NODE_ENV !== 'production') {
      if (this.attachedStores.length > 1) {
        // More than one root is attached at once. This is usually a transient overlap during an
        // animated route transition, where the outgoing root unmounts shortly after the incoming
        // one mounts. Defer the check by a frame and only warn if the overlap is still present once
        // the transition has settled (more than one root stayed mounted), so a clean handoff doesn't
        // warn regardless of the exact unmount timing.
        // The warning frame only exists in development; it is created lazily so it never appears on
        // instances in production (like `controlledValues` in `ReactStore`).
        const dev = this as any;
        (dev.overlapWarningFrame ??= AnimationFrame.create()).request(() => {
          if (this.attachedStores.length > 1) {
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
      const index = this.attachedStores.lastIndexOf(newStore);
      if (index !== -1) {
        this.attachedStores.splice(index, 1);
      }
      // Restore control to the most recently attached root that is still mounted (or detach fully if
      // none remain). Clearing unconditionally would leave a still-mounted older root uncontrollable
      // when a newer overlapping root detaches first (e.g. a canceled route transition).
      this.setActiveStore(this.attachedStores[this.attachedStores.length - 1] ?? null);
    };
  }

  /**
   * Sets the store that currently controls the handle and notifies subscribers when it changes, so
   * detached triggers re-render and migrate their registration to the new store.
   */
  private setActiveStore(store: PreviewCardStore<Payload> | null) {
    if (this.attachedStore !== store) {
      this.attachedStore = store;
      this.notifyStoreListeners();
    }
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
 * Creates a new handle to connect a PreviewCard.Root with detached PreviewCard.Trigger components.
 */
export function createPreviewCardHandle<Payload>(): PreviewCardHandle<Payload> {
  return new PreviewCardHandle<Payload>();
}
