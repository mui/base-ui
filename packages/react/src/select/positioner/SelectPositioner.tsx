'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useSelectRootContext, useSelectFloatingContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useRenderElement } from '../../utils/useRenderElement';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { clearStyles } from '../popup/utils';
import { selectors } from '../store';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { findItemIndex, itemIncludes } from '../../utils/itemEquality';

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
    positionMethod = 'absolute',
    className,
    render,
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking,
    alignItemWithTrigger = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
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

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const modal = useStore(store, selectors.modal);
  const value = useStore(store, selectors.value);
  const openMethod = useStore(store, selectors.openMethod);
  const positionerElement = useStore(store, selectors.positionerElement);
  const triggerElement = useStore(store, selectors.triggerElement);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

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
      if (selectors.scrollUpArrowVisible(store.state)) {
        store.set('scrollUpArrowVisible', false);
      }
      if (selectors.scrollDownArrowVisible(store.state)) {
        store.set('scrollDownArrowVisible', false);
      }
    }
  }, [store, mounted]);

  React.useImperativeHandle(alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);

  useScrollLock(
    (alignItemWithTriggerActive || modal) && open && openMethod !== 'touch',
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

  const defaultProps: React.ComponentProps<'div'> = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
      hiddenStyles.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style: {
        ...positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [open, mounted, positionerStyles]);

  const state: SelectPositioner.State = {
    open,
    side: renderedSide,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
  };

  const setPositionerElement = useStableCallback((element) => {
    store.set('positionerElement', element);
  });

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setPositionerElement],
    state,
    stateAttributesMapping: popupStateMapping,
    props: [defaultProps, elementProps],
  });

  const prevMapSizeRef = React.useRef(0);

  const onMapChange = useStableCallback(
    (map: Map<Element, { index?: (number | null) | undefined } | null>) => {
      if (map.size === 0 && prevMapSizeRef.current === 0) {
        return;
      }

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
        const valueIndex = findItemIndex(valuesRef.current, value, isItemEqualToValue);
        if (valueIndex === -1) {
          const initial = initialValueRef.current;
          const hasInitial =
            initial != null && itemIncludes(valuesRef.current, initial, isItemEqualToValue);
          const nextValue = hasInitial ? initial : null;
          setValue(nextValue, eventDetails);

          if (nextValue === null) {
            store.set('selectedIndex', null);
            selectedItemTextRef.current = null;
          }
        }
      }

      if (prevSize !== 0 && store.state.multiple && Array.isArray(value)) {
        const nextValue = value.filter((v) =>
          itemIncludes(valuesRef.current, v, isItemEqualToValue),
        );
        if (
          nextValue.length !== value.length ||
          nextValue.some((v) => !itemIncludes(value, v, isItemEqualToValue))
        ) {
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
    <CompositeList elementsRef={listRef} labelsRef={labelsRef} onMapChange={onMapChange}>
      <SelectPositionerContext.Provider value={contextValue}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} cutout={triggerElement} />}
        {element}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

export interface SelectPositionerState {
  open: boolean;
  side: Side | 'none';
  align: Align;
  anchorHidden: boolean;
}

export interface SelectPositionerProps
  extends
    useAnchorPositioning.SharedParameters,
    BaseUIComponentProps<'div', SelectPositioner.State> {
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
