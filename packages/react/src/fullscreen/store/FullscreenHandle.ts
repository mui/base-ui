import { FullscreenStore } from './FullscreenStore';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * A handle to control a Fullscreen imperatively and to associate detached
 * triggers with it.
 *
 * Pass the handle to `<Fullscreen.Root handle={...}>` and to any detached
 * `<Fullscreen.Trigger handle={...}>` rendered outside the root. Calling
 * `open()` from a user-gesture handler enters fullscreen the same way a
 * trigger press would.
 */
export class FullscreenHandle {
  /**
   * Internal store holding the fullscreen state.
   * @internal
   */
  public readonly store: FullscreenStore;

  constructor(store?: FullscreenStore) {
    this.store = store ?? new FullscreenStore();
  }

  /**
   * Enters fullscreen and associates the change with the trigger with the given
   * id, if provided.
   *
   * `requestFullscreen()` requires the document to have transient activation,
   * so this method must be called from within a user-gesture event handler
   * (click, keydown, etc.) or from a task that still inherits a recent
   * activation. Calls outside that window will be rejected by the browser; the
   * rejection is caught and reverts state via `onOpenChange(false, { reason: 'none' })`.
   *
   * @param triggerId ID of the trigger to associate with the change. If null
   *   or omitted, the change is dispatched without an associated trigger.
   */
  open(triggerId: string | null = null) {
    const triggerElement =
      triggerId != null
        ? (this.store.context.triggerElements.getById(triggerId) as HTMLElement | undefined)
        : undefined;

    if (process.env.NODE_ENV !== 'production') {
      if (triggerId != null && !triggerElement) {
        console.warn(
          `Base UI: FullscreenHandle.open: No trigger found with id "${triggerId}". The fullscreen will open, but no trigger will be associated with the change.`,
        );
      }
    }

    this.store.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Exits fullscreen.
   *
   * Unlike `open()`, exiting fullscreen does not require a user gesture and
   * can be called at any time.
   */
  close() {
    this.store.setOpen(
      false,
      createChangeEventDetails(REASONS.imperativeAction, undefined, undefined),
    );
  }

  /**
   * Indicates whether the container is currently in fullscreen.
   */
  get isOpen() {
    return this.store.select('open');
  }
}

/**
 * Creates a new handle to control a Fullscreen imperatively or to connect a
 * `<Fullscreen.Root>` with detached `<Fullscreen.Trigger>` components.
 */
export function createFullscreenHandle(): FullscreenHandle {
  return new FullscreenHandle();
}
