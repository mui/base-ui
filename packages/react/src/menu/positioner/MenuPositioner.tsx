'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { FloatingNode } from '../../utils/popups/tree/FloatingTree';
import { MenuPositionerContext } from './MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import type {
  Align,
  Side,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { InternalBackdrop } from '../../utils/popups/InternalBackdrop';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE, POPUP_COLLISION_AVOIDANCE } from '../../internals/constants';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { MenuOpenEventDetails } from '../utils/types';
import { useTriggerSwitchTransition } from '../../internals/useTriggerSwitchTransition';
import { usePopupPositioner } from '../../utils/popups/popupPositioner';
import { useAnchoredPopupScrollLock } from '../../utils/popups/useAnchoredPopupScrollLock';

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
  const { store, virtualFocus, syncHighlightedItem } = useMenuRootContext();
  const keepMounted = useMenuPortalContext();
  const contextMenuContext = useContextMenuRootContext(true);

  const parent = store.useState('parent');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const triggerElement = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const floatingNodeId = store.useState('floatingNodeId');
  const floatingParentNodeId = store.useState('floatingParentNodeId');
  const domReference = store.useState('domReferenceElement');

  const { side } = componentProps;
  let anchor = componentProps.anchor;
  let sideOffset = componentProps.sideOffset;
  let alignOffset = componentProps.alignOffset;
  let align = componentProps.align;
  if (parent.type === 'context-menu') {
    anchor = anchor ?? parent.context?.anchor;
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
  } else if (parent.type === 'menubar') {
    computedSide =
      computedSide ?? (parent.context.orientation === 'vertical' ? 'inline-end' : 'bottom');
    computedAlign = computedAlign ?? 'start';
  }

  const defaultCollisionAvoidance =
    parent.type === 'menu' ? POPUP_COLLISION_AVOIDANCE : DROPDOWN_COLLISION_AVOIDANCE;
  const collisionAvoidance = componentProps.collisionAvoidance ?? defaultCollisionAvoidance;

  const contextMenu = parent.type === 'context-menu';

  const { element, positioning: positioner } = usePopupPositioner(store, componentProps, {
    forwardedRef,
    keepMounted,
    defaults: { collisionAvoidance: defaultCollisionAvoidance },
    positioning: {
      anchor,
      positionMethod: contextMenuContext ? 'fixed' : componentProps.positionMethod,
      side: computedSide,
      sideOffset,
      align: computedAlign,
      alignOffset,
      arrowPadding: contextMenu ? 0 : componentProps.arrowPadding,
      nodeId: floatingNodeId,
      shift: contextMenu
        ? {
            crossAxis: !('side' in collisionAvoidance && collisionAvoidance.side === 'flip'),
            rootBoundary: 'layoutViewport',
          }
        : undefined,
      externalTree: floatingTreeRoot,
      lazyFlip: virtualFocus ? 'placement' : false,
    },
    state: { nested: parent.type === 'menu' },
  });

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

  useTriggerSwitchTransition({
    store,
    domReference,
    positionerElement,
    open,
  });

  const menubarModal = parent.type === 'menubar' && parent.context.modal;
  const popupModal = modal && lastOpenChangeReason !== REASONS.triggerHover;

  useAnchoredPopupScrollLock(
    open && (menubarModal || popupModal),
    openMethod === 'touch',
    positionerElement,
    triggerElement,
  );

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
    <MenuPositionerContext.Provider value={positioner}>
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
          onMapChange={syncHighlightedItem}
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
  extends
    Omit<UseAnchorPositioningSharedParameters, 'side' | 'align'>,
    BaseUIComponentProps<'div', MenuPositionerState> {
  /**
   * How to align the popup relative to the specified side.
   *
   * Submenus and menubars default to `'start'`.
   * @default 'center'
   */
  align?: UseAnchorPositioningSharedParameters['align'] | undefined;
  /**
   * Which side of the anchor element to align the popup against.
   * May automatically change to avoid collisions.
   *
   * Submenus and vertical menubars default to `'inline-end'`.
   * @default 'bottom'
   */
  side?: UseAnchorPositioningSharedParameters['side'] | undefined;
}

export namespace MenuPositioner {
  export type State = MenuPositionerState;
  export type Props = MenuPositionerProps;
}
