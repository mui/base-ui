'use client';
import * as React from 'react';
import {
  FloatingNode,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
} from '../../floating-ui-react';
import { MenuPositionerContext } from './MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { CompositeList } from '../../composite/list/CompositeList';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';

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
    trackAnchor = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const {
    open,
    setOpen,
    floatingRootContext,
    setPositionerElement,
    itemDomElements,
    itemLabels,
    mounted,
    modal,
    lastOpenChangeReason,
    parent,
    setHoverEnabled,
  } = useMenuRootContext();

  const keepMounted = useMenuPortalContext();
  const nodeId = useFloatingNodeId();
  const parentNodeId = useFloatingParentNodeId();
  const contextMenuContext = useContextMenuRootContext(true);

  let anchor = anchorProp;
  let sideOffset = sideOffsetProp;
  let alignOffset = alignOffsetProp;
  let align = alignProp;
  if (parent.type === 'context-menu') {
    anchor = parent.context?.anchor ?? anchorProp;
    align = componentProps.align ?? 'start';
    alignOffset = componentProps.alignOffset ?? 2;
    sideOffset = componentProps.sideOffset ?? -5;
  }

  let computedSide = side;
  let computedAlign = align;
  if (parent.type === 'menu') {
    computedSide = computedSide ?? 'inline-end';
    computedAlign = computedAlign ?? 'start';
  } else if (parent.type === 'menubar') {
    computedSide = computedSide ?? 'bottom';
    computedAlign = computedAlign ?? 'start';
  }

  const contextMenu = parent.type === 'context-menu';

  const positioner = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod: contextMenuContext ? 'fixed' : positionMethodProp,
    mounted,
    side: computedSide,
    sideOffset,
    align: computedAlign,
    alignOffset,
    arrowPadding: contextMenu ? 0 : arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId,
    keepMounted,
    trackAnchor,
    collisionAvoidance,
    shiftCrossAxis: contextMenu,
  });

  const { events: menuEvents } = useFloatingTree()!;

  const positionerProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
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
  }, [open, mounted, positioner.positionerStyles]);

  React.useEffect(() => {
    function onMenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.open) {
        if (event.parentNodeId === nodeId) {
          setHoverEnabled(false);
        }
        if (event.nodeId !== nodeId && event.parentNodeId === parentNodeId) {
          setOpen(false, undefined, 'sibling-open');
        }
      } else if (event.parentNodeId === nodeId) {
        setHoverEnabled(true);
      }
    }

    menuEvents.on('openchange', onMenuOpenChange);

    return () => {
      menuEvents.off('openchange', onMenuOpenChange);
    };
  }, [menuEvents, nodeId, parentNodeId, setOpen, setHoverEnabled]);

  React.useEffect(() => {
    menuEvents.emit('openchange', { open, nodeId, parentNodeId });
  }, [menuEvents, open, nodeId, parentNodeId]);

  const state: MenuPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
      nested: parent.type === 'menu',
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden, parent.type],
  );

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({
      side: positioner.side,
      align: positioner.align,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
      floatingContext: positioner.context,
    }),
    [
      positioner.side,
      positioner.align,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.arrowStyles,
      positioner.context,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping: popupStateMapping,
    ref: [forwardedRef, setPositionerElement],
    props: {
      ...positionerProps,
      ...elementProps,
    },
  });

  const shouldRenderBackdrop =
    mounted &&
    parent.type !== 'menu' &&
    ((parent.type !== 'menubar' && modal && lastOpenChangeReason !== 'trigger-hover') ||
      (parent.type === 'menubar' && parent.context.modal));

  const backdropCutout = parent.type === 'menubar' ? parent.context.contentElement : undefined;

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
      <FloatingNode id={nodeId}>
        <CompositeList elementsRef={itemDomElements} labelsRef={itemLabels}>
          {element}
        </CompositeList>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
});

export namespace MenuPositioner {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    nested: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
