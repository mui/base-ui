'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useSelectFloatingContext, useSelectRootContext } from '../root/SelectRootContext';
import { useSelectVirtualizer } from '../root/SelectVirtualizationContext';
import { getSelectCollection } from '../utils/getSelectCollection';
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
    alignItemWithTrigger: alignItemWithTriggerProp,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;

  const alignItemWithTrigger = alignItemWithTriggerProp ?? true;

  const store = useSelectRootContext();
  const floatingRootContext = useSelectFloatingContext();
  const registeredVirtualizer = useSelectVirtualizer();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');
  const value = store.useState('value');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const triggerElement = store.useState('triggerElement');
  const isItemEqualToValue = store.useState('isItemEqualToValue');
  const transitionStatus = store.useState('transitionStatus');
  const items = store.useState('items');

  const collectionLength = React.useMemo(() => getSelectCollection(items).items.length, [items]);

  const scrollUpArrowRef = React.useRef<HTMLDivElement | null>(null);
  const scrollDownArrowRef = React.useRef<HTMLDivElement | null>(null);

  const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] =
    React.useState(alignItemWithTrigger);

  // A registered virtualizer suppresses this mode, whether or not it is currently windowing.
  // Ownership follows registration throughout Select: the list stops being the scrolling element
  // the moment a virtualizer mounts inside it, and the styles this mode needs go with it. Keying on
  // `enabled` instead leaves a disabled virtualizer aligned while its scrollport is no longer
  // constrained by anything, which renders an unscrollable list inside a short popup.
  //
  // Applied as an independent gate rather than written into the state above, which belongs to the
  // collision fallback: persisting it would make the suppression permanent, so a list that stops
  // being virtualized while the popup is open would never get aligned placement back.
  const alignItemWithTriggerActive =
    mounted &&
    controlledAlignItemWithTrigger &&
    openMethod !== 'touch' &&
    registeredVirtualizer == null;

  if (!mounted && controlledAlignItemWithTrigger !== alignItemWithTrigger) {
    setControlledAlignItemWithTrigger(alignItemWithTrigger);
  }

  React.useImperativeHandle(
    store.context.alignItemWithTriggerActiveRef,
    () => alignItemWithTriggerActive,
  );

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
      if (store.context.valuesRef.current.length === 0) {
        return;
      }

      const prevSize = prevMapSizeRef.current;
      prevMapSizeRef.current = map.size;

      const eventDetails = createChangeEventDetails(REASONS.none);

      // Read live, never from `registeredVirtualizer` state, which is deliberately one render
      // behind. During a static-to-virtualized handover this callback runs after the static items'
      // cleanups have deleted their `valuesRef` entries and before the root's prefill replaces
      // them, so a state-backed guard would still be `false` here and the prune below would clear
      // a perfectly valid selection. The registered path prunes from the root instead, where the
      // collection metadata is already current — and only when the collection or value actually
      // changed, rather than on every rendered-window commit.
      const staticallyOwned = store.context.virtualizationRegistry.virtualizer == null;

      if (staticallyOwned && prevSize !== 0 && !store.state.multiple && value !== null) {
        const selectedValueIndex = findItemIndex(
          store.context.valuesRef.current,
          value,
          isItemEqualToValue,
        );
        if (selectedValueIndex === -1) {
          const initialSelectedValue = store.context.initialValueRef.current;
          const hasInitial =
            initialSelectedValue != null &&
            findItemIndex(
              store.context.valuesRef.current,
              initialSelectedValue,
              isItemEqualToValue,
            ) !== -1;
          const nextValue = hasInitial ? initialSelectedValue : null;
          store.context.setValue(nextValue, eventDetails);

          if (nextValue === null) {
            store.set('selectedIndex', null);
            store.context.selectedItemTextRef.current = null;
          }
        }
      }

      if (staticallyOwned && prevSize !== 0 && store.state.multiple && Array.isArray(value)) {
        const nextValue = value.filter(
          (selectedItemValue) =>
            findItemIndex(
              store.context.valuesRef.current,
              selectedItemValue,
              isItemEqualToValue,
            ) !== -1,
        );
        if (nextValue.length !== value.length) {
          store.context.setValue(nextValue, eventDetails);

          if (nextValue.length === 0) {
            store.set('selectedIndex', null);
            store.context.selectedItemTextRef.current = null;
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
        clearStyles(store.context.popupRef.current, stylesToClear);
      }
    },
  );

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      ...positioning,
      side: renderedSide,
      alignItemWithTriggerActive,
      alignItemWithTriggerExplicit: alignItemWithTriggerProp === true,
      setControlledAlignItemWithTrigger,
      scrollUpArrowRef,
      scrollDownArrowRef,
    }),
    [
      positioning,
      renderedSide,
      alignItemWithTriggerActive,
      alignItemWithTriggerProp,
      setControlledAlignItemWithTrigger,
    ],
  );

  return (
    <CompositeList
      elementsRef={store.context.listRef}
      // A windowed list registers only the mounted rows, so the element array is sized to the whole
      // collection here and the label array is left alone: the root derives complete labels from
      // `items`, and `syncRefs` would otherwise clear them on every registration change.
      itemCount={registeredVirtualizer != null ? collectionLength : undefined}
      labelsRef={registeredVirtualizer != null ? undefined : store.context.labelsRef}
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
   * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space, or when the list is virtualized.
   * @default true
   */
  alignItemWithTrigger?: boolean | undefined;
}

export namespace SelectPositioner {
  export type State = SelectPositionerState;
  export type Props = SelectPositionerProps;
}
