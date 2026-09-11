'use client';
import * as React from 'react';
import type { ContextMenuRoot } from './ContextMenuRoot';

export interface ContextMenuRootContext {
  anchor: { getBoundingClientRect: () => DOMRect };
  setAnchor: React.Dispatch<React.SetStateAction<ContextMenuRootContext['anchor']>>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  actionsRef: React.RefObject<{
    setOpen: (nextOpen: boolean, eventDetails: ContextMenuRoot.ChangeEventDetails) => void;
  } | null>;
  positionerRef: React.RefObject<HTMLElement | null>;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  /**
   * State of the gesture that opened the menu, replaced wholesale on each open.
   */
  gestureRef: React.RefObject<{
    /**
     * The point the menu was opened at (snapped to the device-pixel grid).
     */
    x: number;
    y: number;
    /**
     * Whether a menu item's `mouseup` has already checked the trailing release of the
     * opening right click against the opening point. Ensures only the opening release is
     * ignored; later deliberate releases near the same point must activate the item.
     */
    consumed: boolean;
    /**
     * Whether the menu was opened by a touch long press.
     */
    touch: boolean;
    /**
     * Whether the `contextmenu` event about to reach the trigger belongs to the right
     * click that just dismissed the menu, so it must not immediately reopen it.
     */
    suppressReopen: boolean;
  }>;
  rootId: string | undefined;
}

export const ContextMenuRootContext = React.createContext<ContextMenuRootContext | undefined>(
  undefined,
);

export function useContextMenuRootContext(optional: false): ContextMenuRootContext;
export function useContextMenuRootContext(optional?: true): ContextMenuRootContext | undefined;
export function useContextMenuRootContext(optional = true) {
  const context = React.useContext(ContextMenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ContextMenuRootContext is missing. ContextMenu parts must be placed within <ContextMenu.Root>.',
    );
  }
  return context;
}
