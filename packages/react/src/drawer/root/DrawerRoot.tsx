'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  DrawerRootContext,
  type DrawerSwipeDirection,
  useDrawerRootContext,
} from './DrawerRootContext';
import type { DrawerSnapPoint } from './DrawerSnapPoint';
import { Dialog } from '../../dialog';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';

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
    swipeDirection = 'down',
    snapToSequentialPoints = false,
    snapPoints,
    snapPoint: snapPointProp,
    defaultSnapPoint,
    onSnapPointChange: onSnapPointChangeProp,
  } = props;

  const parentDrawerRootContext = useDrawerRootContext(true);

  const notifyParentSwipeProgressChange = parentDrawerRootContext?.onNestedSwipeProgressChange;
  const notifyParentFrontmostHeight = parentDrawerRootContext?.onNestedFrontmostHeightChange;
  const notifyParentSwipingChange = parentDrawerRootContext?.onNestedSwipingChange;
  const notifyParentHasNestedDrawer = parentDrawerRootContext?.onNestedDrawerPresenceChange;

  const resolvedDefaultSnapPoint =
    defaultSnapPoint !== undefined ? defaultSnapPoint : (snapPoints?.[0] ?? null);

  const [popupHeight, setPopupHeight] = React.useState(0);
  const [frontmostHeight, setFrontmostHeight] = React.useState(0);
  const [hasNestedDrawer, setHasNestedDrawer] = React.useState(false);
  const [nestedSwiping, setNestedSwiping] = React.useState(false);
  const [nestedSwipeProgress, setNestedSwipeProgress] = React.useState(0);
  const [activeSnapPoint, setActiveSnapPointUnwrapped] = useControlled({
    controlled: snapPointProp,
    default: resolvedDefaultSnapPoint,
    name: 'DrawerRoot',
    state: 'snapPoint',
  });

  const isNestedDrawerOpenRef = React.useRef(false);

  const onSnapPointChange = useStableCallback(onSnapPointChangeProp);
  const isSnapPointControlled = snapPointProp !== undefined;

  const setActiveSnapPoint = useStableCallback(
    (
      nextSnapPoint: DrawerSnapPoint | null,
      eventDetails?: DrawerRoot.SnapPointChangeEventDetails,
    ) => {
      const resolvedEventDetails = eventDetails ?? createChangeEventDetails(REASONS.none);
      onSnapPointChange?.(nextSnapPoint, resolvedEventDetails);
      if (resolvedEventDetails.isCanceled) {
        return;
      }

      setActiveSnapPointUnwrapped(nextSnapPoint);
    },
  );

  React.useEffect(() => {
    if (isSnapPointControlled || !snapPoints || snapPoints.length === 0) {
      return;
    }

    if (
      activeSnapPoint === null ||
      !snapPoints.some((snapPoint) => Object.is(snapPoint, activeSnapPoint))
    ) {
      setActiveSnapPointUnwrapped(resolvedDefaultSnapPoint);
    }
  }, [
    activeSnapPoint,
    isSnapPointControlled,
    resolvedDefaultSnapPoint,
    setActiveSnapPointUnwrapped,
    snapPoints,
  ]);

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

  const onNestedSwipeProgressChange = useStableCallback((progress: number) => {
    setNestedSwipeProgress(progress);
    notifyParentSwipeProgressChange?.(progress);
  });

  const onNestedSwipingChange = useStableCallback((swiping: boolean) => {
    setNestedSwiping(swiping);
    notifyParentSwipingChange?.(swiping);
  });

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: DrawerRoot.ChangeEventDetails) => {
      if (!nextOpen && snapPoints && snapPoints.length > 0) {
        setActiveSnapPoint(
          resolvedDefaultSnapPoint,
          createChangeEventDetails(
            eventDetails.reason,
            eventDetails.event,
            eventDetails.trigger as HTMLElement | undefined,
          ),
        );
      }

      onOpenChange?.(nextOpen, eventDetails);
    },
  );

  const contextValue: DrawerRootContext = React.useMemo(
    () => ({
      swipeDirection,
      snapToSequentialPoints,
      snapPoints,
      activeSnapPoint,
      setActiveSnapPoint,
      frontmostHeight,
      popupHeight,
      hasNestedDrawer,
      nestedSwiping,
      nestedSwipeProgress,
      onNestedDrawerPresenceChange,
      onPopupHeightChange,
      onNestedFrontmostHeightChange,
      onNestedSwipingChange,
      onNestedSwipeProgressChange,
      notifyParentFrontmostHeight,
      notifyParentSwipingChange,
      notifyParentSwipeProgressChange,
      notifyParentHasNestedDrawer,
    }),
    [
      activeSnapPoint,
      frontmostHeight,
      hasNestedDrawer,
      nestedSwiping,
      nestedSwipeProgress,
      notifyParentHasNestedDrawer,
      notifyParentSwipeProgressChange,
      notifyParentSwipingChange,
      notifyParentFrontmostHeight,
      onNestedDrawerPresenceChange,
      onNestedFrontmostHeightChange,
      onNestedSwipeProgressChange,
      onNestedSwipingChange,
      onPopupHeightChange,
      popupHeight,
      setActiveSnapPoint,
      snapPoints,
      snapToSequentialPoints,
      swipeDirection,
    ],
  );

  return (
    <DrawerRootContext.Provider value={contextValue}>
      <Dialog.Root
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
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
  open?: boolean | undefined;
  /**
   * Whether the drawer is initially open.
   *
   * To render a controlled drawer, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Determines if the drawer enters a modal state when open.
   * - `true`: user interaction is limited to just the drawer: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the drawer, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default true
   */
  modal?: (boolean | 'trap-focus') | undefined;
  /**
   * Event handler called when the drawer is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: DrawerRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the drawer is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Determines whether the drawer should close on outside clicks.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the drawer will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the drawer manually.
   * Useful when the drawer's animation is controlled by an external library.
   * - `close`: Closes the drawer imperatively when called.
   */
  actionsRef?: React.RefObject<DrawerRoot.Actions> | undefined;
  /**
   * The content of the drawer.
   */
  children?: React.ReactNode;
  /**
   * The swipe direction used to dismiss the drawer.
   * @default 'down'
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * Snap points used to position the drawer. Use numbers between 0 and 1 to
   * represent fractions of the viewport height, or CSS length strings (for
   * example, `'148px'`).
   */
  snapPoints?: DrawerSnapPoint[] | undefined;
  /**
   * Disables velocity-based snap skipping so drag distance determines the next snap point.
   * @default false
   */
  snapToSequentialPoints?: boolean | undefined;
  /**
   * The currently active snap point. Use with `onSnapPointChange` to control the snap point.
   */
  snapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * The initial snap point value when uncontrolled.
   */
  defaultSnapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * Callback fired when the snap point changes.
   */
  onSnapPointChange?:
    | ((
        snapPoint: DrawerSnapPoint | null,
        eventDetails: DrawerRoot.SnapPointChangeEventDetails,
      ) => void)
    | undefined;
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

export type DrawerRootSnapPointChangeEventReason = DrawerRootChangeEventReason;

export type DrawerRootSnapPointChangeEventDetails =
  BaseUIChangeEventDetails<DrawerRootSnapPointChangeEventReason>;

export namespace DrawerRoot {
  export type Props = DrawerRootProps;
  export type Actions = DrawerRootActions;
  export type ChangeEventReason = DrawerRootChangeEventReason;
  export type ChangeEventDetails = DrawerRootChangeEventDetails;
  export type SnapPointChangeEventReason = DrawerRootSnapPointChangeEventReason;
  export type SnapPointChangeEventDetails = DrawerRootSnapPointChangeEventDetails;
  export type SnapPoint = DrawerSnapPoint;
}

function DrawerProviderReporter() {
  const drawerId = React.useId();

  const providerContext = useDrawerProviderContext(true);
  const dialogRootContext = useDialogRootContext(false);
  const open = dialogRootContext.store.useState('open');

  React.useEffect(() => {
    if (!providerContext) {
      return undefined;
    }

    return () => {
      providerContext.removeDrawer(drawerId);
    };
  }, [drawerId, providerContext]);

  React.useEffect(() => {
    providerContext?.setDrawerOpen(drawerId, open);
  }, [drawerId, open, providerContext]);

  return null;
}
