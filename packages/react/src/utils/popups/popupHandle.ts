import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { PopupTriggerMap } from './popupTriggerMap';

/**
 * Minimal store contract exposed by popup handles to detached triggers.
 *
 * Detached triggers read `store` during render and subscribe to be notified when the handle switches
 * between its fallback store and a root's live store.
 *
 * @template HandleStore Store shape exposed to detached triggers.
 */
export interface PopupHandleStoreProvider<HandleStore> {
  /**
   * Store currently exposed by the handle.
   */
  readonly store: HandleStore;

  /**
   * Stable store used to reproduce the server-rendered trigger snapshot during hydration.
   * @internal
   */
  readonly serverStore: HandleStore;

  /**
   * Subscribes to changes of the exposed store pointer.
   *
   * @param listener Callback fired when the handle starts or stops pointing at a root store.
   * @returns Cleanup function that removes the listener.
   */
  subscribeStore(listener: () => void): () => void;
}

/**
 * Store shape holding a trigger registry, required by `BasePopupHandle.openByTrigger` to resolve a
 * trigger element by id on both the attached root's store and the fallback store.
 */
export interface PopupHandleStoreWithTriggers {
  readonly context: { readonly triggerElements: PopupTriggerMap };
}

/**
 * Store shape required by `BasePopupHandle.openByTrigger`/`closePopup` to drive open/close state.
 * Only the root-owned `Store` needs this — the `HandleStore` view exposed to detached triggers may
 * omit `setOpen` entirely (as Dialog and PreviewCard's do) since it is never called while detached.
 */
export interface PopupHandleStoreWithOpen extends PopupHandleStoreWithTriggers {
  select(key: 'open'): boolean;
  setOpen(
    open: boolean,
    eventDetails: BaseUIChangeEventDetails<typeof REASONS.imperativeAction>,
  ): void;
}

/**
 * Shared implementation for popup handles that coordinate detached triggers with a mounted root.
 *
 * Subclasses provide the component-specific imperative methods, while this base class owns the
 * fallback store, root store attachment stack, subscriber notifications, and development warning for
 * overlapping roots.
 *
 * @template HandleStore Store shape exposed to detached triggers.
 * @template Store Root-owned store attached by the component root.
 */
export class BasePopupHandle<
  HandleStore extends PopupHandleStoreWithTriggers,
  Store extends HandleStore & PopupHandleStoreWithOpen,
> {
  /**
   * Stores of every root currently using this handle, in attach order. A handle is meant to be used
   * by a single mounted root, but roots can transiently overlap (e.g. during an animated route
   * transition), so this stack lets `attachStore`'s cleanup restore the previous root instead of
   * leaving a still-mounted root uncontrollable when a newer overlapping root detaches first.
   */
  private readonly attachedStores: Store[] = [];

  /**
   * Store of the root that currently controls the handle: the most recently attached one still
   * mounted, or `null` when no root is attached.
   */
  private attachedStoreValue: Store | null = null;

  private serverStoreValue: HandleStore;

  private serverStoreSource: HandleStore | undefined;

  /**
   * Detached imperative open retained until a matching root commits.
   */
  private pendingOpen:
    | [string | null | undefined, ((store: Store) => void) | undefined]
    | undefined;

  /**
   * Listeners notified when `attachedStore` changes, so detached triggers can follow the store pointer.
   */
  private readonly storeListeners = new Set<() => void>();

  /**
   * Creates a handle backed by the store used while no root is attached.
   *
   * @param fallbackStore Inert, closed store handed to detached triggers while no root is attached,
   * so they can render and register without a mounted root. Triggers register into whichever store
   * `store` currently resolves to, so while detached they live in this store's trigger map and
   * migrate themselves to the root's store (and back) as it attaches/detaches.
   * @param componentName Component name used to prefix dev warnings, e.g. `'Menu'` produces
   * `MenuHandle.open()` in warning text.
   * @param throwOnMissingTrigger Whether `open(triggerId)` throws when no trigger with that id is
   * registered. Anchored popups (Menu, Popover, Tooltip, PreviewCard) need a trigger to anchor to,
   * so they throw; Dialog is not anchored and instead opens unassociated with a dev warning.
   */
  constructor(
    protected readonly fallbackStore: HandleStore,
    private readonly componentName: string,
    private readonly throwOnMissingTrigger: boolean = true,
  ) {
    this.serverStoreValue = fallbackStore;
  }

  protected get attachedStore() {
    return this.attachedStoreValue;
  }

  /**
   * Whether the popup is open or waiting for a root to attach and open it.
   */
  get isOpen() {
    return this.attachedStoreValue?.select('open') ?? this.pendingOpen !== undefined;
  }

  /**
   * Store that detached triggers read from: the attached root's store, or an inert fallback store
   * used while no root is attached.
   * @internal
   */
  get store(): HandleStore {
    return this.attachedStoreValue ?? this.fallbackStore;
  }

  /**
   * Stable snapshot of the last root store rendered before attachment. It is separate from
   * `attachedStoreValue`, so rendering a root does not make imperative calls target a store that may
   * never commit, and it does not change when the root attaches during selective hydration.
   * @internal
   */
  get serverStore(): HandleStore {
    return this.serverStoreValue;
  }

  /**
   * Records the declarative root snapshot during render without attaching it as an imperative
   * target. Once a root commits, abandoned renders can no longer replace the hydration snapshot.
   * @internal
   */
  setServerStore(store: HandleStore) {
    if (this.attachedStoreValue === null && this.serverStoreSource !== store) {
      this.serverStoreSource = store;

      const state = (store as HandleStore & { state: object }).state;
      this.serverStoreValue = Object.assign(Object.create(store), {
        state,
        getSnapshot: () => state,
      });
    }
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
   * cleanup function that detaches the store again.
   * @internal
   */
  attachStore(newStore: Store) {
    this.attachedStores.push(newStore);
    this.setActiveStore(newStore);

    const pendingOpen = this.pendingOpen;
    if (pendingOpen) {
      const triggerId = pendingOpen[0];
      if (
        !triggerId ||
        this.fallbackStore.context.triggerElements.getById(triggerId) ||
        !this.throwOnMissingTrigger
      ) {
        this.pendingOpen = undefined;
        this.openByTrigger(...pendingOpen);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (this.attachedStores.length > 1) {
        // More than one root is attached at once. This is usually a transient overlap during an
        // animated route transition, where the outgoing root unmounts shortly after the incoming
        // one mounts. Defer the check by a frame and only warn if the overlap is still present once
        // the transition has settled (more than one root stayed mounted), so a clean handoff doesn't
        // warn regardless of the exact unmount timing.
        // The warning frame only exists in development; it is created lazily so it never appears on
        // instances in production (like `controlledValues` in `ReactStore`).
        const dev = this as this & { overlapWarningFrame?: AnimationFrame | undefined };
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
  private setActiveStore(store: Store | null) {
    if (this.attachedStoreValue !== store) {
      this.attachedStoreValue = store;
      this.storeListeners.forEach((listener) => {
        listener();
      });
    }
  }

  /**
   * Opens the attached root's store and associates it with the trigger with the given id. While no
   * root is attached, the operation is retained until the next matching root commits. Shared by
   * every concrete handle's public `open()` method, which only narrows the parameter type.
   *
   * When a trigger id is given but no matching trigger is registered, anchored popups throw (see
   * `throwOnMissingTrigger`); Dialog opens unassociated with a dev warning instead.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the popup, or `null`/`undefined` to open
   * without associating any trigger.
   * @param prepareStore Optional component-specific state update to apply immediately before opening.
   */
  protected openByTrigger(
    triggerId: string | null | undefined,
    prepareStore?: (store: Store) => void,
  ) {
    const attachedStore = this.attachedStore;
    let triggerElement: Element | undefined;
    if (triggerId) {
      for (let i = this.attachedStores.length - 1; i >= 0 && !triggerElement; i -= 1) {
        triggerElement = this.attachedStores[i].context.triggerElements.getById(triggerId);
      }
      triggerElement ??= this.fallbackStore.context.triggerElements.getById(triggerId);
    }

    if (triggerId && !triggerElement) {
      if (this.throwOnMissingTrigger) {
        throw new Error(
          `Base UI: ${this.componentName}Handle.open() was called with the trigger id "${triggerId}", ` +
            'but no matching trigger is registered with this handle. ' +
            'An anchored popup cannot open without a trigger to anchor to. ' +
            `Pass the id of a mounted ${this.componentName}.Trigger that has this handle set on its "handle" prop.`,
        );
      }

      if (attachedStore !== null && process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.open: No trigger found with id "${triggerId}". ` +
            'The popup will open, but the trigger will not be associated with it.',
        );
      }
    }

    if (attachedStore === null) {
      this.pendingOpen = [triggerId, prepareStore];
      return;
    }

    prepareStore?.(attachedStore);
    attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Closes the popup by setting the attached root's store to closed. While no root is attached, it
   * cancels any retained open. Shared by every concrete handle's public `close()` method.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  protected closePopup() {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      this.pendingOpen = undefined;
      return;
    }

    attachedStore.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }
}
