import { CommandPaletteStore } from './CommandPaletteStore';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A handle to control a CommandPalette imperatively.
 */
export class CommandPaletteHandle {
  /**
   * Internal store holding the command palette state.
   * @internal
   */
  public readonly store: CommandPaletteStore;

  constructor(store?: CommandPaletteStore) {
    this.store = store ?? new CommandPaletteStore();
  }

  /**
   * Opens the command palette.
   */
  open() {
    this.store.setOpen(true, createChangeEventDetails(REASONS.imperativeAction));
  }

  /**
   * Closes the command palette.
   */
  close() {
    this.store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }

  /**
   * Indicates whether the command palette is currently open.
   */
  get isOpen() {
    return this.store.state.open;
  }
}

/**
 * Creates a new handle to control a CommandPalette imperatively.
 */
export function createCommandPaletteHandle(): CommandPaletteHandle {
  return new CommandPaletteHandle();
}
