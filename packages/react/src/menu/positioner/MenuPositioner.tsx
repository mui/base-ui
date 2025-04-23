'use client';
import * as React from 'react';
import { FloatingNode, useFloatingNodeId, useFloatingParentNodeId } from '@floating-ui/react';
import { MenuPositionerContext } from './MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuPositioner } from './useMenuPositioner';
import { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { CompositeList } from '../../composite/list/CompositeList';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';

/**
 * Positions the menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPositioner = React.forwardRef(function MenuPositioner(
  props: MenuPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor: anchorProp,
    positionMethod = 'absolute',
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
    ...otherProps
  } = props;

  const {
    open,
    floatingRootContext,
    setPositionerElement,
    itemDomElements,
    itemLabels,
    mounted,
    nested,
    modal,
    openReason,
  } = useMenuRootContext();
  const keepMounted = useMenuPortalContext();

  const nodeId = useFloatingNodeId();
  const parentNodeId = useFloatingParentNodeId();
  const contextMenuContext = useContextMenuRootContext();
  const hasContextMenuContext = Boolean(contextMenuContext);

  let anchor = anchorProp;
  let sideOffset = sideOffsetProp;
  let alignOffset = alignOffsetProp;
  let align = alignProp;
  if (hasContextMenuContext && !nested) {
    anchor = contextMenuContext?.anchor ?? anchorProp;
    align = props.align ?? 'start';
    alignOffset = props.alignOffset ?? 2;
    sideOffset = props.sideOffset ?? -5;
  }

  let computedSide = side;
  let computedAlign = align;
  if (!side) {
    computedSide = nested ? 'inline-end' : 'bottom';
  }
  if (!align) {
    computedAlign = nested ? 'start' : 'center';
  }

  const positioner = useMenuPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    open,
    mounted,
    side: computedSide,
    sideOffset,
    align: computedAlign,
    alignOffset,
    arrowPadding: hasContextMenuContext ? 0 : arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId,
    parentNodeId,
    keepMounted,
    trackAnchor,
    shiftCrossAxis: hasContextMenuContext,
  });

  const state: MenuPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
      nested,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden, nested],
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

  const mergedRef = useForkRef(forwardedRef, setPositionerElement);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    customStyleHookMapping: popupStateMapping,
    ref: mergedRef,
    extraProps: {
      ...positioner.positionerProps,
      ...otherProps,
    },
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      {mounted && modal && openReason !== 'hover' && parentNodeId === null && (
        <InternalBackdrop ref={contextMenuContext?.internalBackdropRef} inert={inertValue(!open)} />
      )}
      <FloatingNode id={nodeId}>
        <CompositeList elementsRef={itemDomElements} labelsRef={itemLabels}>
          {renderElement()}
        </CompositeList>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
});

namespace MenuPositioner {
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
    extends useMenuPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}

export { MenuPositioner };
