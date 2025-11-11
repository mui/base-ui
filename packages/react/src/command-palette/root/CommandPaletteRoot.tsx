'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useCommandPaletteRoot } from './useCommandPaletteRoot';
import { CommandPaletteRootContext } from './CommandPaletteRootContext';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { CommandPaletteStore, type CommandPaletteItem } from '../store/CommandPaletteStore';
import { CommandPaletteHandle } from '../store/CommandPaletteHandle';

/**
 * Groups all parts of the command palette.
 * Doesn't render its own HTML element.
 */
export function CommandPaletteRoot(props: CommandPaletteRoot.Props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    items = [],
    filterFn,
    actionsRef,
    handle,
  } = props;

  const store = useRefWithInit(
    () => handle?.store ?? new CommandPaletteStore({ filterFn }),
  ).current;

  store.useControlledProp('open', openProp, defaultOpen);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  // Update items in context
  React.useEffect(() => {
    store.context.items.current = items;
    store.updateFilteredItems();
  }, [store, items]);

  useCommandPaletteRoot({
    store,
    actionsRef,
  });

  const contextValue = React.useMemo(() => ({ store }), [store]);

  return (
    <CommandPaletteRootContext.Provider value={contextValue}>
      {children}
    </CommandPaletteRootContext.Provider>
  );
}

export interface CommandPaletteRootProps {
  /**
   * Whether the command palette is currently open.
   */
  open?: boolean;
  /**
   * Whether the command palette is initially open.
   * To render a controlled command palette, use the `open` prop instead.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Event handler called when the command palette is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: CommandPaletteRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the command palette is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * The list of command items to display.
   */
  items?: CommandPaletteItem[];
  /**
   * Custom filter function for filtering items based on query.
   * If not provided, a default filter is used that matches against label and keywords.
   */
  filterFn?: (query: string, items: CommandPaletteItem[]) => CommandPaletteItem[];
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the command palette will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the command palette manually.
   * - `close`: Closes the command palette.
   */
  actionsRef?: React.RefObject<CommandPaletteRoot.Actions>;
  /**
   * A handle to associate the command palette with external controls.
   * Can be created with the CommandPalette.createHandle() method.
   *
   * ```tsx
   * const handle = CommandPalette.createHandle();
   *
   * // ...
   *
   * <CommandPalette.Root handle={handle}>...</CommandPalette.Root>
   * ```
   */
  handle?: CommandPaletteHandle;
  /**
   * The content of the command palette.
   */
  children?: React.ReactNode;
}

export interface CommandPaletteRootActions {
  unmount: () => void;
  close: () => void;
}

export type CommandPaletteRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type CommandPaletteRootChangeEventDetails =
  BaseUIChangeEventDetails<CommandPaletteRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace CommandPaletteRoot {
  export type Props = CommandPaletteRootProps;
  export type Actions = CommandPaletteRootActions;
  export type ChangeEventReason = CommandPaletteRootChangeEventReason;
  export type ChangeEventDetails = CommandPaletteRootChangeEventDetails;
}
