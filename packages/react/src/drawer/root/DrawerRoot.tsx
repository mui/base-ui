'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  DrawerRootContext,
  type DrawerSwipeDirection,
  useDrawerRootContext,
} from './DrawerRootContext';
import { Dialog } from '../../dialog';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';

function DrawerProviderReporter() {
  const providerContext = useDrawerProviderContext(true);
  const dialogRootContext = useDialogRootContext(false);
  const mounted = dialogRootContext.store.useState('mounted');

  const drawerId = React.useId();

  React.useEffect(() => {
    if (!providerContext) {
      return undefined;
    }

    return () => {
      providerContext.removeDrawer(drawerId);
    };
  }, [drawerId, providerContext]);

  React.useEffect(() => {
    providerContext?.setDrawerOpen(drawerId, mounted);
  }, [drawerId, mounted, providerContext]);

  return null;
}

/**
 * Groups all parts of the drawer.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export function DrawerRoot(props: DrawerRoot.Props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    disablePointerDismissal = false,
    modal = true,
    actionsRef,
    swipeDirection = 'right',
  } = props;

  const parentDrawerRootContext = useDrawerRootContext(true);

  const [popupHeight, setPopupHeight] = React.useState(0);
  const [frontmostHeight, setFrontmostHeight] = React.useState(0);
  const [hasNestedDrawer, setHasNestedDrawer] = React.useState(false);
  const [nestedSwiping, setNestedSwiping] = React.useState(false);
  const isNestedDrawerOpenRef = React.useRef(false);

  const onPopupHeightChange = useStableCallback((height: number) => {
    setPopupHeight(height);

    if (!isNestedDrawerOpenRef.current && height > 0) {
      setFrontmostHeight(height);
    }
  });

  const onNestedFrontmostHeightChange = useStableCallback((height: number) => {
    if (height > 0) {
      isNestedDrawerOpenRef.current = true;
      setFrontmostHeight(height);
      return;
    }

    isNestedDrawerOpenRef.current = false;
    if (popupHeight > 0) {
      setFrontmostHeight(popupHeight);
    }
  });

  const onNestedDrawerPresenceChange = useStableCallback((present: boolean) => {
    setHasNestedDrawer(present);
  });

  const onNestedSwipingChange = useStableCallback((swiping: boolean) => {
    setNestedSwiping(swiping);
  });

  const notifyParentFrontmostHeight = parentDrawerRootContext?.onNestedFrontmostHeightChange;
  const notifyParentSwipingChange = parentDrawerRootContext?.onNestedSwipingChange;
  const notifyParentHasNestedDrawer = parentDrawerRootContext?.onNestedDrawerPresenceChange;

  const contextValue: DrawerRootContext = React.useMemo(
    () => ({
      swipeDirection,
      frontmostHeight,
      hasNestedDrawer,
      nestedSwiping,
      onNestedDrawerPresenceChange,
      onPopupHeightChange,
      onNestedFrontmostHeightChange,
      onNestedSwipingChange,
      notifyParentFrontmostHeight,
      notifyParentSwipingChange,
      notifyParentHasNestedDrawer,
    }),
    [
      frontmostHeight,
      hasNestedDrawer,
      nestedSwiping,
      notifyParentHasNestedDrawer,
      notifyParentSwipingChange,
      notifyParentFrontmostHeight,
      onNestedDrawerPresenceChange,
      onNestedFrontmostHeightChange,
      onNestedSwipingChange,
      onPopupHeightChange,
      swipeDirection,
    ],
  );

  return (
    <DrawerRootContext.Provider value={contextValue}>
      <Dialog.Root
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        disablePointerDismissal={disablePointerDismissal}
        modal={modal}
        actionsRef={actionsRef}
      >
        <DrawerProviderReporter />
        {children}
      </Dialog.Root>
    </DrawerRootContext.Provider>
  );
}

export interface DrawerRootProps {
  /**
   * Whether the drawer is currently open.
   */
  open?: boolean;
  /**
   * Whether the drawer is initially open.
   *
   * To render a controlled drawer, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Determines if the drawer enters a modal state when open.
   * - `true`: user interaction is limited to just the drawer: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the drawer, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default true
   */
  modal?: boolean | 'trap-focus';
  /**
   * Event handler called when the drawer is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: DrawerRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the drawer is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Determines whether the drawer should close on outside clicks.
   * @default false
   */
  disablePointerDismissal?: boolean;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the drawer will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the drawer manually.
   * Useful when the drawer's animation is controlled by an external library.
   * - `close`: Closes the drawer imperatively when called.
   */
  actionsRef?: React.RefObject<DrawerRoot.Actions>;
  /**
   * The content of the drawer.
   */
  children?: React.ReactNode;
  /**
   * The swipe direction used to dismiss the drawer.
   * @default 'right'
   */
  swipeDirection?: DrawerSwipeDirection;
}

export interface DrawerRootActions {
  unmount: () => void;
  close: () => void;
}

export type DrawerRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.swipe
  | typeof REASONS.none;

export type DrawerRootChangeEventDetails =
  BaseUIChangeEventDetails<DrawerRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace DrawerRoot {
  export type Props = DrawerRootProps;
  export type Actions = DrawerRootActions;
  export type ChangeEventReason = DrawerRootChangeEventReason;
  export type ChangeEventDetails = DrawerRootChangeEventDetails;
}
