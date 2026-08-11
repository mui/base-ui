'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useSelectRootContext } from '../root/SelectRootContext';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../internals/types';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../internals/constants';
import { clearStyles } from '../popup/utils';
import { selectors, type RegisteredItem, type SelectItemMetadata } from '../store';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { compareItemEquality } from '../../internals/itemEquality';
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
    alignItemWithTrigger: alignItemWithTriggerProp,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;

  const {
    store,
    floatingContext: floatingRootContext,
    listRef,
    alignItemWithTriggerActiveRef,
    initialValueRef,
    popupRef,
    setValue,
  } = useSelectRootContext();

  const open = useStore(store, selectors.open);
  const filterable = useStore(store, selectors.filterable);
  const mounted = useStore(store, selectors.mounted);
  const modal = useStore(store, selectors.modal);
  const multiple = useStore(store, selectors.multiple);
  const value = useStore(store, selectors.value);
  const openMethod = useStore(store, selectors.openMethod);
  const positionerElement = useStore(store, selectors.positionerElement);
  const triggerElement = useStore(store, selectors.triggerElement);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const registeredItems = useStore(store, selectors.registeredItems);
  const previousRegisteredItemsRef = React.useRef(registeredItems);

  const scrollUpArrowRef = React.useRef<HTMLDivElement | null>(null);
  const scrollDownArrowRef = React.useRef<HTMLDivElement | null>(null);

  // The prop is the consumer's preference; the state is a per-open fallback the popup turns off
  // when alignment can't work (viewport collision, pinch zoom). Keeping them separate lets the
  // fallback apply even with an explicit `alignItemWithTrigger`, and resetting while unmounted
  // stops one failed opening from disabling alignment for every later one.
  const alignItemWithTriggerPreference = alignItemWithTriggerProp ?? !filterable;
  const [alignItemWithTrigger, setAlignItemWithTrigger] = React.useState(
    alignItemWithTriggerPreference,
  );

  if (!mounted && alignItemWithTrigger !== alignItemWithTriggerPreference) {
    setAlignItemWithTrigger(alignItemWithTriggerPreference);
  }

  const alignItemWithTriggerActive = mounted && alignItemWithTrigger && openMethod !== 'touch';

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

  const handleCompositeListChange = useStableCallback(
    (map: Map<Element, ({ index?: number | null | undefined } & SelectItemMetadata) | null>) => {
      const prevIndexes = store.state.visibleItemIndexes;
      const nextIndexes = new Map<symbol, number>();
      let hasIndexesChanged = false;

      for (const metadata of map.values()) {
        if (metadata?.index != null) {
          nextIndexes.set(metadata.registrationId, metadata.index);
          hasIndexesChanged ||= prevIndexes.get(metadata.registrationId) !== metadata.index;
        }
      }

      if (hasIndexesChanged || prevIndexes.size !== nextIndexes.size) {
        store.set('visibleItemIndexes', nextIndexes);
      }

      const prevSize = prevMapSizeRef.current;
      prevMapSizeRef.current = map.size;

      if (map.size === prevSize) {
        return;
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
      setAlignItemWithTrigger,
      scrollUpArrowRef,
      scrollDownArrowRef,
    }),
    [positioning, renderedSide, alignItemWithTriggerActive, setAlignItemWithTrigger],
  );

  // Reconcile after React commits both the item registry and the possibly controlled value.
  // A filterable root narrows `items` before rendering, so its registrations fluctuate with the
  // query; there the full `items` data is the removal authority instead (see SelectRoot).
  useIsoLayoutEffect(
    function syncSelectedValueOnItemRemoval() {
      if (store.state.filterable) {
        return;
      }

      const previousRegisteredItems = previousRegisteredItemsRef.current;
      previousRegisteredItemsRef.current = registeredItems;

      if (!isItemRemoved(previousRegisteredItems, registeredItems)) {
        return;
      }

      function getNextSelectedValue() {
        const isItemRegistered = createItemMatcher(registeredItems, isItemEqualToValue);

        if (multiple) {
          if (Array.isArray(value)) {
            const remainingValues = value.filter(isItemRegistered);
            return remainingValues.length === value.length ? value : remainingValues;
          }
        }

        if (value != null && !isItemRegistered(value)) {
          const initialValue = initialValueRef.current;
          const hasInitialValue = initialValue != null && isItemRegistered(initialValue);
          return hasInitialValue ? initialValue : null;
        }

        return value;
      }

      const nextSelectedValue = getNextSelectedValue();
      if (value === nextSelectedValue) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.none);
      setValue(nextSelectedValue, eventDetails);

      const hasNoSelectionReference =
        nextSelectedValue == null ||
        (multiple && Array.isArray(nextSelectedValue) && nextSelectedValue.length === 0);

      if (hasNoSelectionReference) {
        store.set('selectionReferenceItemId', null);
      }
    },
    [store, multiple, registeredItems, setValue, value, isItemEqualToValue, initialValueRef],
  );

  return (
    <CompositeList elementsRef={listRef} onMapChange={handleCompositeListChange}>
      <SelectPositionerContext.Provider value={contextValue}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} cutout={triggerElement} />}
        {element}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

function createItemMatcher(
  registeredItems: ReadonlyMap<symbol, RegisteredItem>,
  isItemEqualToValue: (a: any, b: any) => boolean,
) {
  return (itemValue: any) => {
    for (const item of registeredItems.values()) {
      if (compareItemEquality(item.getValue(), itemValue, isItemEqualToValue)) {
        return true;
      }
    }
    return false;
  };
}

function isItemRemoved(
  previousMap: ReadonlyMap<symbol, RegisteredItem>,
  currentMap: ReadonlyMap<symbol, RegisteredItem>,
) {
  if (previousMap.size > currentMap.size) {
    return true;
  }

  for (const id of previousMap.keys()) {
    if (!currentMap.has(id)) {
      return true;
    }
  }

  return false;
}

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
   * @default true for standard selects; false for filterable selects
   */
  alignItemWithTrigger?: boolean | undefined;
}

export namespace SelectPositioner {
  export type State = SelectPositionerState;
  export type Props = SelectPositionerProps;
}
