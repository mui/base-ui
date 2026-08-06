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
    registeredItemValuesRef,
    valuesRef,
    initialValueRef,
    popupRef,
    setValue,
    floatingContext: floatingRootContext,
  } = useSelectRootContext();

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

  useIsoLayoutEffect(
    () => () => {
      // The rendered items own the selection bookkeeping. Leaving a stale index behind lets
      // `SelectItemText` re-adopt it on the next mount, before the value has been re-matched
      // against the items that are actually rendered then.
      store.set('selectedIndex', null);
      selectedItemTextRef.current = null;
    },
    [store, selectedItemTextRef],
  );

  const onMapChange = useStableCallback(
    (map: Map<Element, { index?: number | null | undefined } | null>) => {
      if (valuesRef.current.length === 0) {
        return;
      }

      const prevValues = registeredItemValuesRef.current;
      const nextValues = valuesRef.current.slice(0, map.size);
      registeredItemValuesRef.current = nextValues;

      const sizeChanged = nextValues.length !== prevValues.length;
      // Validate the selection whenever the registered values change, not only when the item
      // count does: replacing the collection with one of equal size (including across an
      // unmount and remount) must still prune a value that no longer exists. Flushes that
      // only refresh labels or indices skip it, so a controlled value that deliberately
      // matches no item isn't pruned by re-registration churn.
      const valuesChanged =
        sizeChanged ||
        nextValues.some((itemValue, index) => !Object.is(itemValue, prevValues[index]));

      const shouldValidate = prevValues.length !== 0 && valuesChanged;

      if (shouldValidate && !store.state.multiple && value !== null) {
        const selectedValueIndex = findItemIndex(valuesRef.current, value, isItemEqualToValue);
        if (selectedValueIndex === -1) {
          const initialSelectedValue = initialValueRef.current;
          const hasInitial =
            initialSelectedValue != null &&
            findItemIndex(valuesRef.current, initialSelectedValue, isItemEqualToValue) !== -1;
          const nextValue = hasInitial ? initialSelectedValue : null;
          setValue(nextValue, createChangeEventDetails(REASONS.none));

          if (nextValue === null) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }

      if (shouldValidate && store.state.multiple && Array.isArray(value)) {
        const nextValue = value.filter(
          (selectedItemValue) =>
            findItemIndex(valuesRef.current, selectedItemValue, isItemEqualToValue) !== -1,
        );
        if (nextValue.length !== value.length) {
          setValue(nextValue, createChangeEventDetails(REASONS.none));

          if (nextValue.length === 0) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }

      if (!sizeChanged) {
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
      setControlledAlignItemWithTrigger,
      scrollUpArrowRef,
      scrollDownArrowRef,
    }),
    [positioning, renderedSide, alignItemWithTriggerActive, setControlledAlignItemWithTrigger],
  );

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef} onMapChange={onMapChange}>
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
