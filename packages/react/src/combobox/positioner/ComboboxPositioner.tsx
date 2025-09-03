'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { inertValue } from '@base-ui-components/utils/inertValue';
import {
  useComboboxFloatingContext,
  useComboboxRootContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import { ComboboxPositionerContext } from './ComboboxPositionerContext';
import { type Side, type Align, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useComboboxPortalContext } from '../portal/ComboboxPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useScrollLock } from '../../utils/useScrollLock';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 */
export const ComboboxPositioner = React.forwardRef(function ComboboxPositioner(
  componentProps: ComboboxPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItems } = useComboboxDerivedItemsContext();
  const floatingRootContext = useComboboxFloatingContext();
  const keepMounted = useComboboxPortalContext();

  const modal = useStore(store, selectors.modal);
  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const openMethod = useStore(store, selectors.openMethod);
  const triggerElement = useStore(store, selectors.triggerElement);
  const inputElement = useStore(store, selectors.inputElement);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);

  const empty = filteredItems.length === 0;
  const resolvedAnchor = anchor ?? (inputInsidePopup ? triggerElement : inputElement);

  const positioning = useAnchorPositioning({
    anchor: resolvedAnchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
    collisionAvoidance,
    lazyFlip: true,
  });

  useScrollLock({
    enabled: open && modal && openMethod !== 'touch',
    mounted,
    open,
    referenceElement: triggerElement,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const style: React.CSSProperties = {
      ...positioning.positionerStyles,
    };

    if (!open) {
      style.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style,
    };
  }, [open, mounted, positioning.positionerStyles]);

  const state: ComboboxPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
      empty,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden, empty],
  );

  const contextValue: ComboboxPositionerContext = React.useMemo(
    () => ({
      side: positioning.side,
      align: positioning.align,
      arrowRef: positioning.arrowRef,
      arrowUncentered: positioning.arrowUncentered,
      arrowStyles: positioning.arrowStyles,
      anchorHidden: positioning.anchorHidden,
      isPositioned: positioning.isPositioned,
    }),
    [
      positioning.side,
      positioning.align,
      positioning.arrowRef,
      positioning.arrowUncentered,
      positioning.arrowStyles,
      positioning.anchorHidden,
      positioning.isPositioned,
    ],
  );

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setPositionerElement],
    props: [defaultProps, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <ComboboxPositionerContext.Provider value={contextValue}>
      {mounted && modal && (
        <InternalBackdrop inert={inertValue(!open)} cutout={inputElement ?? triggerElement} />
      )}
      {element}
    </ComboboxPositionerContext.Provider>
  );
});

export namespace ComboboxPositioner {
  export interface State {
    /**
     * Whether the popup is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    empty: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
