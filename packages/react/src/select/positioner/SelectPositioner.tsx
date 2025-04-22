'use client';
import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelectPositioner } from './useSelectPositioner';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { inertValue } from '../../utils/inertValue';

/**
 * Positions the select menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPositioner = React.forwardRef(function SelectPositioner(
  props: SelectPositioner.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
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
    ...otherProps
  } = props;

  const { open, mounted, setPositionerElement, listRef, labelsRef, floatingRootContext, modal } =
    useSelectRootContext();

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
    keepMounted: true,
  });

  const mergedRef = useForkRef(ref, setPositionerElement);

  const state: SelectPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: positioner.getPositionerProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping: popupStateMapping,
    extraProps: otherProps,
  });

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
      <SelectPositionerContext.Provider value={positioner}>
        {mounted && modal && <InternalBackdrop inert={inertValue(!open)} />}
        {renderElement()}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

namespace SelectPositioner {
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

export { SelectPositioner };
