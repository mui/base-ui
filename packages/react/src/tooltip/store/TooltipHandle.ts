import { TooltipStore } from './TooltipStore';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * A handle to control a tooltip imperatively and to associate detached triggers with it.
 */
export class TooltipHandle<Payload> {
  /**
   * Internal store holding the tooltip state.
   * @internal
   */
  public readonly store: TooltipStore<Payload>;

  constructor() {
    this.store = new TooltipStore<Payload>();
  }

  /**
   * Opens the tooltip and associates it with the trigger with the given ID.
   * The trigger must be a Tooltip.Trigger component with this handle passed as a prop.
   *
   * @param triggerId ID of the trigger to associate with the tooltip.
   */
  open(triggerId: string) {
    const triggerElement = triggerId
      ? (this.store.state.triggers.get(triggerId) ?? undefined)
      : undefined;

    if (triggerId && !triggerElement) {
      throw new Error(`Base UI: TooltipHandle.open: No trigger found with id "${triggerId}".`);
    }

    this.store.setOpen(
      true,
      createChangeEventDetails('imperative-action', undefined, triggerElement),
    );
  }

  /**
   * Closes the tooltip.
   */
  close() {
    this.store.setOpen(false, createChangeEventDetails('imperative-action', undefined, undefined));
  }

  /**
   * Indicates whether the tooltip is currently open.
   */
  get isOpen() {
    return this.store.state.open;
  }
}

/**
 * Creates a new handle to connect a Tooltip.Root with detached Tooltip.Trigger components.
 */
export function createTooltipHandle<Payload>(): TooltipHandle<Payload> {
  return new TooltipHandle<Payload>();
}
