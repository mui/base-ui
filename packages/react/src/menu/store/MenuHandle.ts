import { MenuStore, createNullMenuStore, type MenuHandleStore } from './MenuStore';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a Menu imperatively and associates detached `Menu.Trigger` components with a `Menu.Root`.
 * Create one with `Menu.createHandle()` and pass it to the `handle` prop of the root and of any
 * triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class MenuHandle<Payload> extends BasePopupHandle<
  MenuHandleStore<Payload>,
  MenuStore<Payload>
> {
  constructor() {
    super(createNullMenuStore<Payload>(), 'Menu');
  }

  /**
   * Opens the menu and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the menu. The trigger must be a matching
   * `Menu.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the menu.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the menu is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a new handle to connect a Menu.Root with detached Menu.Trigger components.
 */
export function createMenuHandle<Payload>(): MenuHandle<Payload> {
  return new MenuHandle<Payload>();
}
