'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import {
  useSelectDerivedItemsContext,
  useSelectRootContext,
  useSelectFloatingContext,
} from '../root/SelectRootContext';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../internals/types';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../internals/constants';
import { clearStyles } from '../popup/utils';
import { selectors } from '../store';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { findItemIndex } from '../../internals/itemEquality';
import { usePositioner } from '../../utils/usePositioner';
import { useAnchoredPopupScrollLock } from '../../utils/useAnchoredPopupScrollLock';

const FIXED: React.CSSProperties = { position: 'fixed' };

/**
 * Positions the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectPositioner = React.forwardRef(function SelectPositioner(
  componentProps: SelectPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    className,
    render,
    // `useAnchorPositioning` applies the same defaults to the undefined values; the names
    // remain destructured to exclude the props from `elementProps`.
    positionMethod,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding,
    sticky,
    disableAnchorTracking,
    alignItemWithTrigger = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;

  const {
    store,
    listRef,
    labelsRef,
    alignItemWithTriggerActiveRef,
    selectedItemTextRef,
    valuesRef,
    initialValueRef,
    popupRef,
    setValue,
  } = useSelectRootContext();
  const floatingRootContext = useSelectFloatingContext();
  const { flatItems, hasItems } = useSelectDerivedItemsContext();

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const modal = useStore(store, selectors.modal);
  const value = useStore(store, selectors.value);
  const openMethod = useStore(store, selectors.openMethod);
  const positionerElement = useStore(store, selectors.positionerElement);
  const triggerElement = useStore(store, selectors.triggerElement);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
  const transitionStatus = useStore(store, selectors.transitionStatus);

  const scrollUpArrowRef = React.useRef<HTMLDivElement | null>(null);
  const scrollDownArrowRef = React.useRef<HTMLDivElement | null>(null);

  const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] =
    React.useState(alignItemWithTrigger);
  const alignItemWithTriggerActive =
    mounted && controlledAlignItemWithTrigger && openMethod !== 'touch';

  if (!mounted && controlledAlignItemWithTrigger !== alignItemWithTrigger) {
    setControlledAlignItemWithTrigger(alignItemWithTrigger);
  }

  useIsoLayoutEffect(() => {
    if (!mounted) {
      store.update({ scrollUpArrowVisible: false, scrollDownArrowVisible: false });
    }
  }, [store, mounted]);

  React.useImperativeHandle(alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);

  useAnchoredPopupScrollLock(
    (alignItemWithTriggerActive || modal) && open,
    openMethod === 'touch',
    positionerElement,
    triggerElement,
  );

  const positioning = useAnchorPositioning({
    anchor,
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
    disableAnchorTracking: disableAnchorTracking ?? alignItemWithTriggerActive,
    collisionAvoidance,
    keepMounted: true,
  });

  const renderedSide = alignItemWithTriggerActive ? 'none' : positioning.side;
  const positionerStyles = alignItemWithTriggerActive ? FIXED : positioning.positionerStyles;

  const state: SelectPositionerState = {
    open,
    side: renderedSide,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
  };

  useIsoLayoutEffect(() => {
    store.set('popupSide', positioning.side);
  }, [store, positioning.side]);

  const setPositionerElement = store.useStateSetter('positionerElement');

  const element = usePositioner(componentProps, state, {
    styles: positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open,
  });

  const prevMapSizeRef = React.useRef(0);

  const onMapChange = useStableCallback(
    (map: Map<Element, { index?: number | null | undefined } | null>) => {
      if (valuesRef.current.length === 0) {
        return;
      }

      const prevSize = prevMapSizeRef.current;
      prevMapSizeRef.current = map.size;

      if (map.size === prevSize) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.none);

      if (prevSize !== 0 && !store.state.multiple && value !== null) {
        const selectedValueIndex = findItemIndex(valuesRef.current, value, isItemEqualToValue);
        if (selectedValueIndex === -1) {
          const initialSelectedValue = initialValueRef.current;
          const hasInitial =
            initialSelectedValue != null &&
            findItemIndex(valuesRef.current, initialSelectedValue, isItemEqualToValue) !== -1;
          const nextValue = hasInitial ? initialSelectedValue : null;
          setValue(nextValue, eventDetails);

          if (nextValue === null) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }

      if (prevSize !== 0 && store.state.multiple && Array.isArray(value)) {
        const nextValue = value.filter(
          (selectedItemValue) =>
            findItemIndex(valuesRef.current, selectedItemValue, isItemEqualToValue) !== -1,
        );
        if (nextValue.length !== value.length) {
          setValue(nextValue, eventDetails);

          if (nextValue.length === 0) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }

      if (open && alignItemWithTriggerActive) {
        store.update({
          scrollUpArrowVisible: false,
          scrollDownArrowVisible: false,
        });

        const stylesToClear: React.CSSProperties = { height: '' };
        clearStyles(positionerElement, stylesToClear);
        clearStyles(popupRef.current, stylesToClear);
      }
    },
  );

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      ...positioning,
      side: renderedSide,
      alignItemWithTriggerActive,
      setControlledAlignItemWithTrigger,
      scrollUpArrowRef,
      scrollDownArrowRef,
    }),
    [positioning, renderedSide, alignItemWithTriggerActive, setControlledAlignItemWithTrigger],
  );

  return (
    <CompositeList
      elementsRef={listRef}
      itemCount={hasItems ? flatItems.length : undefined}
      labelsRef={hasItems ? undefined : labelsRef}
      onMapChange={onMapChange}
    >
      <SelectPositionerContext.Provider value={contextValue}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} cutout={triggerElement} />}
        {element}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

export interface SelectPositionerState {
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
}

export interface SelectPositionerProps
  extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', SelectPositionerState> {
  /**
   * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
   * @default true
   */
  alignItemWithTrigger?: boolean | undefined;
}

export namespace SelectPositioner {
  export type State = SelectPositionerState;
  export type Props = SelectPositionerProps;
}
