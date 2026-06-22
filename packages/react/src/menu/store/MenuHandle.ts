import { isHTMLElement } from '@floating-ui/utils/dom';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  clearStoreOwnerlessOpen,
  hasStoreOwner,
  markStoreOwnerlessOpen,
  setPopupOpenState,
} from '../../utils/popups';
import { MenuStore, type State as MenuStoreState } from './MenuStore';

export class MenuHandle<Payload> {
  /**
   * Internal store holding the menu's state.
   * @internal
   */
  public readonly store: MenuStore<Payload>;

  constructor() {
    this.store = new MenuStore<Payload>();
  }

  /**
   * Opens the menu and associates it with the trigger with the given id.
   * The trigger must be a Menu.Trigger component with this handle passed as a prop.
   *
   * @param triggerId ID of the trigger to associate with the menu.
   */
  open(triggerId: string) {
    const triggerElement = triggerId
      ? (this.store.context.triggerElements.getById(triggerId) as HTMLElement | undefined)
      : undefined;

    if (triggerId && !triggerElement) {
      throw new Error(`Base UI: MenuHandle.open: No trigger found with id "${triggerId}".`);
    }

    const ownerless = !hasStoreOwner(this.store);
    const eventDetails = createChangeEventDetails(
      REASONS.imperativeAction,
      undefined,
      triggerElement,
    );

    markStoreOwnerlessOpen(this.store);

    if (ownerless) {
      const updatedState: Partial<MenuStoreState<Payload>> = {
        open: true,
        openChangeReason: REASONS.imperativeAction,
      };

      setPopupOpenState(updatedState, true, triggerElement);
      this.store.update(updatedState);
    }

    this.store.setOpen(true, eventDetails);
  }

  /**
   * Closes the menu.
   */
  close() {
    const ownerless = !hasStoreOwner(this.store);
    const activeTriggerElement = this.store.state.activeTriggerElement;
    const triggerElement = isHTMLElement(activeTriggerElement) ? activeTriggerElement : undefined;
    const eventDetails = createChangeEventDetails(
      REASONS.imperativeAction,
      undefined,
      triggerElement,
    );

    clearStoreOwnerlessOpen(this.store);

    if (ownerless) {
      const updatedState: Partial<MenuStoreState<Payload>> = {
        open: false,
        openChangeReason: REASONS.imperativeAction,
      };

      setPopupOpenState(updatedState, false, eventDetails.trigger);
      this.store.update(updatedState);
    }

    this.store.setOpen(false, eventDetails);
  }

  /**
   * Indicates whether the menu is currently open.
   */
  get isOpen() {
    return this.store.select('open');
  }
}

/**
 * Creates a new handle to connect a Menu.Root with detached Menu.Trigger components.
 */
export function createMenuHandle<Payload>(): MenuHandle<Payload> {
  return new MenuHandle<Payload>();
}
