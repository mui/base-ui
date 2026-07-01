import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TooltipStore, createNullTooltipStore, type TooltipHandleStore } from './TooltipStore';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a Tooltip imperatively and associates detached `Tooltip.Trigger` components with a
 * `Tooltip.Root`. Create one with `Tooltip.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class TooltipHandle<Payload> extends BasePopupHandle<
  TooltipHandleStore<Payload>,
  TooltipStore<Payload>
> {
  constructor() {
    super(createNullTooltipStore<Payload>());
  }

  /**
   * Opens the tooltip and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the tooltip. The trigger must be a matching
   * `Tooltip.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string) {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: TooltipHandle.open() was called while no root using this handle is mounted. ' +
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
      ? ((attachedStore.context.triggerElements.getById(triggerId) ??
          this.fallbackStore.context.triggerElements.getById(triggerId)) as HTMLElement | undefined)
      : undefined;

    if (process.env.NODE_ENV !== 'production') {
      if (triggerId && !triggerElement) {
        console.warn(
          `Base UI: TooltipHandle.open: No trigger found with id "${triggerId}". The tooltip will open, but the trigger will not be associated with the tooltip.`,
        );
      }
    }

    attachedStore.setOpen(
      true,
      createChangeEventDetails(REASONS.imperativeAction, undefined, triggerElement),
    );
  }

  /**
   * Closes the tooltip.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Base UI: TooltipHandle.close() was called while no root using this handle is mounted. ' +
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

  /**
   * Whether the tooltip is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a new handle to connect a Tooltip.Root with detached Tooltip.Trigger components.
 */
export function createTooltipHandle<Payload>(): TooltipHandle<Payload> {
  return new TooltipHandle<Payload>();
}
