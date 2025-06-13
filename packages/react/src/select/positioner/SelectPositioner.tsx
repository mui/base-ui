'use client';
import * as React from 'react';
import { useSelectRootContext, useSelectFloatingContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { inertValue } from '../../utils/inertValue';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { clearPositionerStyles } from '../popup/utils';
import { useEventCallback } from '../../utils/useEventCallback';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { useScrollLock } from '../../utils';

/**
 * Positions the select menu popup.
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
    trackAnchor = true,
    alignItemWithTrigger = true,
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const { store, listRef, labelsRef, alignItemWithTriggerActiveRef, valuesRef } =
    useSelectRootContext();
  const floatingRootContext = useSelectFloatingContext();

  const open = useSelector(store, selectors.open);
  const mounted = useSelector(store, selectors.mounted);
  const modal = useSelector(store, selectors.modal);
  const value = useSelector(store, selectors.value);
  const touchModality = useSelector(store, selectors.touchModality);
  const positionerElement = useSelector(store, selectors.positionerElement);
  const triggerElement = useSelector(store, selectors.triggerElement);

  const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] =
    React.useState(alignItemWithTrigger);
  const alignItemWithTriggerActive = mounted && controlledAlignItemWithTrigger && !touchModality;

  if (!mounted && controlledAlignItemWithTrigger !== alignItemWithTrigger) {
    setControlledAlignItemWithTrigger(alignItemWithTrigger);
  }

  useModernLayoutEffect(() => {
    if (!alignItemWithTrigger || !mounted) {
      if (selectors.scrollUpArrowVisible(store.state)) {
        store.set('scrollUpArrowVisible', false);
      }
      if (selectors.scrollDownArrowVisible(store.state)) {
        store.set('scrollDownArrowVisible', false);
      }
    }
  }, [store, mounted, alignItemWithTrigger]);

  React.useImperativeHandle(alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);

  useScrollLock({
    enabled: (alignItemWithTriggerActive || modal) && open,
    mounted,
    open,
    referenceElement: triggerElement,
  });

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
    trackAnchor: trackAnchor ?? !alignItemWithTriggerActive,
    collisionAvoidance,
    keepMounted: true,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (alignItemWithTriggerActive ? { position: 'fixed' } : positioning.positionerStyles),
    [alignItemWithTriggerActive, positioning.positionerStyles],
  );

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

  const state: SelectPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden],
  );

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setPositionerElement],
    state,
    customStyleHookMapping: popupStateMapping,
    props: [defaultProps, elementProps],
  });

  const prevMapSizeRef = React.useRef(0);

  const onMapChange = useEventCallback((map: Map<Element, { index?: number | null } | null>) => {
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

    if (value !== null) {
      const valueIndex = valuesRef.current.indexOf(value);
      if (valueIndex === -1) {
        store.apply({
          label: '',
          selectedIndex: null,
        });
      }
    }

    if (open && alignItemWithTriggerActive) {
      store.apply({
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
      });

      if (positionerElement) {
        clearPositionerStyles(positionerElement, { height: '' });
      }
    }
  });

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      ...positioning,
      alignItemWithTriggerActive,
      setControlledAlignItemWithTrigger,
    }),
    [positioning, alignItemWithTriggerActive, setControlledAlignItemWithTrigger],
  );

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef} onMapChange={onMapChange}>
      <SelectPositionerContext.Provider value={contextValue}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} />}
        {element}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

export namespace SelectPositioner {
  export interface State {
    open: boolean;
    side: Side | 'none';
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {
    /**
     * Whether the positioner overlaps the trigger so the selected item's text is aligned
     * with the trigger's value text. This only applies to mouse input and is automatically
     * disabled if there is not enough space.
     * @default true
     */
    alignItemWithTrigger?: boolean;
  }
}
