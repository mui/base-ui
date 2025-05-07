'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelectPositioner } from './useSelectPositioner';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { inertValue } from '../../utils/inertValue';
import { useRenderElement } from '../../utils/useRenderElement';
import { DEFAULT_COLLISION_AVOIDANCE } from '../../utils/constants';

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

  const {
    open,
    mounted,
    setPositionerElement,
    listRef,
    labelsRef,
    floatingRootContext,
    modal,
    touchModality,
    scrollUpArrowVisible,
    setScrollUpArrowVisible,
    scrollDownArrowVisible,
    setScrollDownArrowVisible,
    alignItemWithTriggerActiveRef,
  } = useSelectRootContext();

  const [controlledItemAnchor, setControlledItemAnchor] = React.useState(alignItemWithTrigger);
  const alignItemWithTriggerActive = mounted && controlledItemAnchor && !touchModality;

  React.useImperativeHandle(alignItemWithTriggerActiveRef, () => alignItemWithTriggerActive);

  if (!mounted && controlledItemAnchor !== alignItemWithTrigger) {
    setControlledItemAnchor(alignItemWithTrigger);
  }

  if (!alignItemWithTrigger || !mounted) {
    if (scrollUpArrowVisible) {
      setScrollUpArrowVisible(false);
    }
    if (scrollDownArrowVisible) {
      setScrollDownArrowVisible(false);
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
    alignItemWithTriggerActive,
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

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setPositionerElement],
    state,
    customStyleHookMapping: popupStateMapping,
    props: [positioner.getPositionerProps, elementProps],
  });

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      ...positioner,
      alignItemWithTriggerActive,
      controlledItemAnchor,
      setControlledItemAnchor,
    }),
    [positioner, alignItemWithTriggerActive, controlledItemAnchor],
  );

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
      <SelectPositionerContext.Provider value={contextValue}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} />}
        {renderElement()}
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
