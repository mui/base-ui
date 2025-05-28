'use client';
import * as React from 'react';
import { useSelectRootContext, useSelectFloatingContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelectPositioner } from './useSelectPositioner';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { inertValue } from '../../utils/inertValue';
import { useFirstRender } from '../../utils/useFirstRender';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { DEFAULT_COLLISION_AVOIDANCE } from '../../utils/constants';
import { clearPositionerStyles } from '../popup/utils';
import { useEventCallback } from '../../utils/useEventCallback';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

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
    collisionAvoidance = DEFAULT_COLLISION_AVOIDANCE,
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
  const controlledItemAnchor = useSelector(store, selectors.controlledItemAnchor);
  const alignItemWithTriggerActive = useSelector(store, selectors.alignItemWithTriggerActive);

  useFirstRender(() => {
    const controlledItemAnchorV = alignItemWithTrigger;
    const alignItemWithTriggerActiveV = mounted && controlledItemAnchor && !touchModality;

    store.set('controlledItemAnchor', controlledItemAnchorV);
    store.set('alignItemWithTriggerActive', alignItemWithTriggerActiveV);
  });

  useModernLayoutEffect(() => {
    return store.subscribe((state) => {
      const alignItemWithTriggerActiveV =
        selectors.mounted(state) &&
        selectors.controlledItemAnchor(state) &&
        !selectors.touchModality(state);
      store.set('alignItemWithTriggerActive', alignItemWithTriggerActiveV);
    });
  }, [store]);

  React.useImperativeHandle(alignItemWithTriggerActiveRef, () =>
    selectors.alignItemWithTriggerActive(store.state),
  );

  if (!mounted && controlledItemAnchor !== alignItemWithTrigger) {
    store.set('controlledItemAnchor', alignItemWithTrigger);
  }

  if (!alignItemWithTrigger || !mounted) {
    if (selectors.scrollUpArrowVisible(store.state)) {
      store.set('scrollUpArrowVisible', false);
    }
    if (selectors.scrollDownArrowVisible(store.state)) {
      store.set('scrollUpArrowVisible', false);
    }
  }

  const positioner = useSelectPositioner({
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
    trackAnchor,
    collisionAvoidance,
    keepMounted: true,
  });

  const state: SelectPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setPositionerElement],
    state,
    customStyleHookMapping: popupStateMapping,
    props: [positioner.getPositionerProps, elementProps],
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

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef} onMapChange={onMapChange}>
      <SelectPositionerContext.Provider value={positioner}>
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
    extends useSelectPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
