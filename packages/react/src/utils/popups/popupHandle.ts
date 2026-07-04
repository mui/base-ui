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
> implements PopupHandleStoreProvider<HandleStore> {
  /**
   * Inert, closed store handed to detached triggers while no root is attached, so they can render
   * and register without a mounted root. Triggers register into whichever store `store` currently
   * resolves to, so while detached they live in this store's trigger map and migrate themselves to
   * the root's store (and back) as it attaches/detaches.
   */
  private readonly fallbackStoreValue: HandleStore;

  /**
   * Stores of every root currently using this handle, in attach order. A handle is meant to be used
   * by a single mounted root, but roots can transiently overlap (e.g. during an animated route
   * transition), so this stack lets `attachStore`'s cleanup restore the previous root instead of
   * leaving a still-mounted root uncontrollable when a newer overlapping root detaches first.
   */
  private readonly attachedStores: Store[] = [];

  /**
   * Store of the root that currently controls the handle: the most recently attached one still
   * mounted, or `null` when no root is attached. Imperative methods are no-ops while this is `null`.
   */
  private attachedStoreValue: Store | null = null;

  /**
   * Listeners notified when `attachedStore` changes, so detached triggers can follow the store pointer.
   */
  private readonly storeListeners = new Set<() => void>();

  /**
   * Creates a handle backed by the store used while no root is attached.
   *
   * @param fallbackStore Inert store exposed to detached triggers before a root mounts.
   * @param componentName Component name used to prefix dev warnings, e.g. `'Menu'` produces
   * `MenuHandle.open()` in warning text.
   * @param throwOnMissingTrigger Whether `open(triggerId)` throws when no trigger with that id is
   * registered. Anchored popups (Menu, Popover, Tooltip, PreviewCard) need a trigger to anchor to,
   * so they throw; Dialog is not anchored and instead opens unassociated with a dev warning.
   */
  constructor(
    fallbackStore: HandleStore,
    private readonly componentName: string,
    private readonly throwOnMissingTrigger: boolean = true,
  ) {
    this.fallbackStoreValue = fallbackStore;
  }

  protected get attachedStore() {
    return this.attachedStoreValue;
  }

  protected get fallbackStore() {
    return this.fallbackStoreValue;
  }

  /**
   * Store that detached triggers read from: the attached root's store, or an inert fallback store
   * used while no root is attached.
   * @internal
   */
  get store(): HandleStore {
    return this.attachedStoreValue ?? this.fallbackStoreValue;
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

  /**
   * Opens the attached root's store and associates it with the trigger with the given id, or a
   * no-op (with a dev warning) while no root is attached. Shared by every concrete handle's public
   * `open()` method, which only narrows the parameter type.
   *
   * When a trigger id is given but no matching trigger is registered, anchored popups throw (see
   * `throwOnMissingTrigger`); Dialog opens unassociated with a dev warning instead.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the popup, or `null`/`undefined` to open
   * without associating any trigger.
   */
  protected openByTrigger(triggerId: string | null | undefined) {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.open() was called while no root using this handle is mounted. ` +
            'The call was ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    // Registered triggers normally live in the active root's store. During the commit in which a
    // root attaches, a still-mounted detached trigger has not re-registered into that store yet (it
    // migrates on its next render): it is still registered wherever it lived before — the fallback
    // store when this is the first root to attach, or a previously attached root's store during a
    // transient overlap (e.g. an animated route transition). Search the whole attachment stack
    // (newest first) and the fallback map so an imperative open-by-id called in that commit (e.g.
    // from a layout effect) still resolves the trigger instead of treating it as missing.
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

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.open: No trigger found with id "${triggerId}". ` +
            'The popup will open, but the trigger will not be associated with it.',
        );
      }
    }

    attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Closes the popup by setting the attached root's store to closed, or a no-op (with a dev warning)
   * while no root is attached. Shared by every concrete handle's public `close()` method.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  protected closePopup() {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Base UI: ${this.componentName}Handle.close() was called while no root using this handle is mounted. ` +
            'The call was ignored.',
        );
      }
      return;
    }

    attachedStore.setOpen(
      false,
      createChangeEventDetails(REASONS.imperativeAction, undefined, undefined),
    );
  }
}
