'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { FloatingNode } from '../../floating-ui-react';
import { MenuPositionerContext } from './MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { CompositeList } from '../../composite/list/CompositeList';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE, POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { getDisabledMountTransitionStyles } from '../../utils/getDisabledMountTransitionStyles';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { MenuOpenEventDetails } from '../utils/types';
import { adaptiveOrigin } from '../../utils/adaptiveOriginMiddleware';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';

/**
 * Positions the menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPositioner = React.forwardRef(function MenuPositioner(
  componentProps: MenuPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor: anchorProp,
    positionMethod: positionMethodProp = 'absolute',
    className,
    render,
    side,
    align: alignProp,
    sideOffset: sideOffsetProp = 0,
    alignOffset: alignOffsetProp = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking = false,
    collisionAvoidance: collisionAvoidanceProp = DROPDOWN_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const { store } = useMenuRootContext();

  const keepMounted = useMenuPortalContext();
  const contextMenuContext = useContextMenuRootContext(true);

  const parent = store.useState('parent');
  const floatingRootContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const modal = store.useState('modal');
  const triggerElement = store.useState('activeTriggerElement');
  const transitionStatus = store.useState('transitionStatus');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');
  const hasViewport = store.useState('hasViewport');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const floatingNodeId = store.useState('floatingNodeId');
  const floatingParentNodeId = store.useState('floatingParentNodeId');
  const domReference = floatingRootContext.useState('domReferenceElement');
  const parentMenuStore = parent.type === 'menu' ? parent.store : null;
  const parentReadyFrame = useAnimationFrame();
  const positionerUpdateFrame = useAnimationFrame();
  const revealFrame = useAnimationFrame();
  const [parentReadyToPosition, setParentReadyToPosition] = React.useState(
    () => parentMenuStore?.select('openTransitionComplete') ?? true,
  );
  const [submenuReadyToReveal, setSubmenuReadyToReveal] = React.useState(
    () => parent.type !== 'menu',
  );

  const previousTriggerRef = React.useRef<Element | null>(null);
  const blockedByParentAnimationRef = React.useRef(false);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement, false, false);
  // Only defer nested reveal for submenus that are already open while their parent is animating.
  // Keyboard- and pointer-opened submenus should still reveal eagerly so focus behavior stays intact.
  const shouldDeferNestedReveal = parent.type === 'menu' && lastOpenChangeReason == null;

  useIsoLayoutEffect(() => {
    if (parentMenuStore == null) {
      parentReadyFrame.cancel();
      setParentReadyToPosition(true);
      return undefined;
    }

    const menuStore = parentMenuStore;

    function syncParentReadyState() {
      if (!menuStore.select('openTransitionComplete')) {
        const parentPopup = menuStore.context.popupRef.current;
        const parentPopupStyles = parentPopup ? getComputedStyle(parentPopup) : null;
        const parentPopupAnimations =
          parentPopup && typeof parentPopup.getAnimations === 'function'
            ? parentPopup.getAnimations()
            : null;
        const parentIsActuallyAnimating =
          (parentPopupAnimations != null && parentPopupAnimations.length > 0) ||
          (parentPopupStyles != null &&
            (hasMotionDuration(parentPopupStyles.transitionDuration) ||
              hasMotionDuration(parentPopupStyles.animationDuration)));

        if (!parentIsActuallyAnimating) {
          parentReadyFrame.cancel();
          setParentReadyToPosition(true);
          return;
        }

        parentReadyFrame.cancel();
        setParentReadyToPosition(false);
        return;
      }

      // Submenu triggers live inside the parent popup and can still move for one paint after the
      // parent's open animation reports completion. Wait one extra frame so the child positions
      // against the settled trigger rect rather than the last in-flight transformed rect.
      parentReadyFrame.request(() => {
        setParentReadyToPosition(menuStore.select('openTransitionComplete'));
      });
    }

    syncParentReadyState();

    // This positioner lives in the child menu store but needs to react to the parent menu's
    // open-complete state, so subscribe directly rather than mirroring that state through the child.
    const unsubscribe = menuStore.subscribe(syncParentReadyState);

    return () => {
      parentReadyFrame.cancel();
      unsubscribe();
    };
  }, [parentMenuStore, parentReadyFrame]);

  const positionerMounted = mounted && (parent.type !== 'menu' || parentReadyToPosition);

  let anchor = anchorProp;
  let sideOffset = sideOffsetProp;
  let alignOffset = alignOffsetProp;
  let align = alignProp;
  let collisionAvoidance = collisionAvoidanceProp;
  if (parent.type === 'context-menu') {
    anchor = anchorProp ?? parent.context?.anchor;
    align = align ?? 'start';
    if (!side && align !== 'center') {
      alignOffset = componentProps.alignOffset ?? 2;
      sideOffset = componentProps.sideOffset ?? -5;
    }
  }

  let computedSide = side;
  let computedAlign = align;
  if (parent.type === 'menu') {
    computedSide = computedSide ?? 'inline-end';
    computedAlign = computedAlign ?? 'start';
    collisionAvoidance = componentProps.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE;
  } else if (parent.type === 'menubar') {
    computedSide = computedSide ?? 'bottom';
    computedAlign = computedAlign ?? 'start';
  }

  const contextMenu = parent.type === 'context-menu';

  const positioner = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod: contextMenuContext ? 'fixed' : positionMethodProp,
    mounted: positionerMounted,
    side: computedSide,
    sideOffset,
    align: computedAlign,
    alignOffset,
    arrowPadding: contextMenu ? 0 : arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId: floatingNodeId,
    keepMounted,
    disableAnchorTracking,
    collisionAvoidance,
    shiftCrossAxis:
      contextMenu && !('side' in collisionAvoidance && collisionAvoidance.side === 'flip'),
    externalTree: floatingTreeRoot,
    adaptiveOrigin: hasViewport ? adaptiveOrigin : undefined,
  });
  const updatePositioner = positioner.update;

  useIsoLayoutEffect(() => {
    if (parent.type !== 'menu') {
      positionerUpdateFrame.cancel();
      revealFrame.cancel();
      blockedByParentAnimationRef.current = false;
      setSubmenuReadyToReveal(true);
      return undefined;
    }

    if (!mounted) {
      positionerUpdateFrame.cancel();
      revealFrame.cancel();
      blockedByParentAnimationRef.current = false;
      setSubmenuReadyToReveal(true);
      return undefined;
    }

    if (!shouldDeferNestedReveal) {
      positionerUpdateFrame.cancel();
      revealFrame.cancel();
      blockedByParentAnimationRef.current = false;
      setSubmenuReadyToReveal(true);
      return undefined;
    }

    if (!parentReadyToPosition) {
      positionerUpdateFrame.cancel();
      revealFrame.cancel();
      blockedByParentAnimationRef.current = true;
      setSubmenuReadyToReveal(false);
      return undefined;
    }

    if (!blockedByParentAnimationRef.current) {
      setSubmenuReadyToReveal(true);
      return undefined;
    }

    // The submenu was held hidden for a parent animation, so force one hidden remeasure first and
    // only reveal on the following frame. This avoids painting the stale pre-animation position.
    blockedByParentAnimationRef.current = false;
    setSubmenuReadyToReveal(false);

    positionerUpdateFrame.request(() => {
      updatePositioner();

      revealFrame.request(() => {
        updatePositioner();
        setSubmenuReadyToReveal(true);
      });
    });

    return () => {
      positionerUpdateFrame.cancel();
      revealFrame.cancel();
    };
  }, [
    mounted,
    parent.type,
    parentReadyToPosition,
    shouldDeferNestedReveal,
    updatePositioner,
    positionerUpdateFrame,
    revealFrame,
  ]);

  const positionerProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
      hiddenStyles.pointerEvents = 'none';
    }

    if (
      parent.type === 'menu' &&
      shouldDeferNestedReveal &&
      (!parentReadyToPosition || !submenuReadyToReveal || !positioner.isPositioned)
    ) {
      hiddenStyles.visibility = 'hidden';
      hiddenStyles.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style: {
        ...positioner.positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [
    open,
    mounted,
    parent.type,
    parentReadyToPosition,
    shouldDeferNestedReveal,
    submenuReadyToReveal,
    positioner.isPositioned,
    positioner.positionerStyles,
  ]);

  React.useEffect(() => {
    function onMenuOpenChange(details: MenuOpenEventDetails) {
      if (details.open) {
        if (details.parentNodeId === floatingNodeId) {
          store.set('hoverEnabled', false);
        }
        if (
          details.nodeId !== floatingNodeId &&
          details.parentNodeId === store.select('floatingParentNodeId')
        ) {
          store.setOpen(false, createChangeEventDetails(REASONS.siblingOpen));
        }
      }
    }

    floatingTreeRoot.events.on('menuopenchange', onMenuOpenChange);

    return () => {
      floatingTreeRoot.events.off('menuopenchange', onMenuOpenChange);
    };
  }, [store, floatingTreeRoot.events, floatingNodeId]);

  React.useEffect(() => {
    if (store.select('floatingParentNodeId') == null) {
      return undefined;
    }

    function onParentClose(details: MenuOpenEventDetails) {
      if (details.open || details.nodeId !== store.select('floatingParentNodeId')) {
        return;
      }

      const reason: MenuRoot.ChangeEventReason = details.reason ?? REASONS.siblingOpen;
      store.setOpen(false, createChangeEventDetails(reason));
    }

    floatingTreeRoot.events.on('menuopenchange', onParentClose);

    return () => {
      floatingTreeRoot.events.off('menuopenchange', onParentClose);
    };
  }, [floatingTreeRoot.events, store]);

  const closeTimeout = useTimeout();

  // Clear pending close timeout when the menu closes.
  React.useEffect(() => {
    if (!open) {
      closeTimeout.clear();
    }
  }, [open, closeTimeout]);

  // Close unrelated child submenus when hovering a different item in the parent menu.
  React.useEffect(() => {
    function onItemHover(event: { nodeId: string | undefined; target: Element | null }) {
      // If an item within our parent menu is hovered, and this menu's trigger is not that item,
      // close this submenu. This ensures hovering a different item in the parent closes other branches.
      if (!open || event.nodeId !== store.select('floatingParentNodeId')) {
        return;
      }

      if (event.target && triggerElement && triggerElement !== event.target) {
        const delay = store.select('closeDelay');
        if (delay > 0) {
          if (!closeTimeout.isStarted()) {
            closeTimeout.start(delay, () => {
              store.setOpen(false, createChangeEventDetails(REASONS.siblingOpen));
            });
          }
        } else {
          store.setOpen(false, createChangeEventDetails(REASONS.siblingOpen));
        }
      } else {
        // User re-hovered the submenu trigger, cancel pending close.
        closeTimeout.clear();
      }
    }

    floatingTreeRoot.events.on('itemhover', onItemHover);
    return () => {
      floatingTreeRoot.events.off('itemhover', onItemHover);
    };
  }, [floatingTreeRoot.events, open, triggerElement, store, closeTimeout]);

  React.useEffect(() => {
    const eventDetails: MenuOpenEventDetails = {
      open,
      nodeId: floatingNodeId,
      parentNodeId: floatingParentNodeId,
      reason: store.select('lastOpenChangeReason'),
    };

    floatingTreeRoot.events.emit('menuopenchange', eventDetails);
  }, [floatingTreeRoot.events, open, store, floatingNodeId, floatingParentNodeId]);

  // Keep positioner transition behavior aligned with Popover when switching detached triggers.
  useIsoLayoutEffect(() => {
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;

    if (currentTrigger) {
      previousTriggerRef.current = currentTrigger;
    }

    if (previousTrigger && currentTrigger && currentTrigger !== previousTrigger) {
      store.set('instantType', undefined);

      const abortController = new AbortController();
      runOnceAnimationsFinish(() => {
        store.set('instantType', 'trigger-change');
      }, abortController.signal);

      return () => {
        abortController.abort();
      };
    }

    return undefined;
  }, [domReference, runOnceAnimationsFinish, store]);

  const state: MenuPositionerState = {
    open,
    side: positioner.side,
    align: positioner.align,
    anchorHidden: positioner.anchorHidden,
    nested: parent.type === 'menu',
    instant: instantType,
  };

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({
      side: positioner.side,
      align: positioner.align,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
      nodeId: positioner.context.nodeId,
      deferEnterTransition: shouldDeferNestedReveal && !submenuReadyToReveal,
    }),
    [
      positioner.side,
      positioner.align,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.arrowStyles,
      positioner.context.nodeId,
      shouldDeferNestedReveal,
      submenuReadyToReveal,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: popupStateMapping,
    ref: [forwardedRef, store.useStateSetter('positionerElement')],
    props: [positionerProps, getDisabledMountTransitionStyles(transitionStatus), elementProps],
  });

  const shouldRenderBackdrop =
    mounted &&
    parent.type !== 'menu' &&
    ((parent.type !== 'menubar' && modal && lastOpenChangeReason !== REASONS.triggerHover) ||
      (parent.type === 'menubar' && parent.context.modal));

  // cuts a hole in the backdrop to allow pointer interaction with the menubar or dropdown menu trigger element
  let backdropCutout: HTMLElement | null = null;
  if (parent.type === 'menubar') {
    backdropCutout = parent.context.contentElement;
  } else if (parent.type === undefined) {
    backdropCutout = triggerElement as HTMLElement | null;
  }

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      {shouldRenderBackdrop && (
        <InternalBackdrop
          ref={
            parent.type === 'context-menu' || parent.type === 'nested-context-menu'
              ? parent.context.internalBackdropRef
              : null
          }
          inert={inertValue(!open)}
          cutout={backdropCutout}
        />
      )}
      <FloatingNode id={floatingNodeId}>
        <CompositeList
          elementsRef={store.context.itemDomElements}
          labelsRef={store.context.itemLabels}
        >
          {element}
        </CompositeList>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
});

export interface MenuPositionerState {
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether the component is nested.
   */
  nested: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}

export interface MenuPositionerProps
  extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', MenuPositionerState> {}

export namespace MenuPositioner {
  export type State = MenuPositionerState;
  export type Props = MenuPositionerProps;
}

/**
 * Returns whether a computed CSS duration list contains any non-zero entry.
 * @param value A computed CSS duration string such as
 *   `getComputedStyle(element).transitionDuration` or `.animationDuration`.
 *   These values are comma-separated when multiple properties or keyframes are involved.
 */
function hasMotionDuration(value: string) {
  return value
    .split(',')
    .some((part) => Number.parseFloat(part) > 0 && !Number.isNaN(Number.parseFloat(part)));
}
