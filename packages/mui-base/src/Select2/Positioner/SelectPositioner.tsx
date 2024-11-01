'use client';
import * as React from 'react';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../SelectRoot';
import { CompositeList } from '../../Composite/List/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import { useSelectPositioner } from './useSelectPositioner';

interface SelectPositionerContext {
  positioner: ReturnType<typeof useSelectPositioner>['positioner'];
}

const SelectPositionerContext = React.createContext<SelectPositionerContext | null>(null);

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (context === null) {
    throw new Error('useSelectPositionerContext must be used within a SelectPositioner');
  }
  return context;
}

export const SelectPositioner = React.forwardRef(function SelectPositioner(
  props: SelectPositioner.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    positionMethod = 'absolute',
    className,
    render,
    keepMounted = true,
    side = 'bottom',
    alignment = 'start',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    container,
    ...otherProps
  } = props;

  const { mounted, setPositionerElement, listRef, labelsRef, floatingRootContext } =
    useSelectRootContext();

  const { getPositionerProps, positioner } = useSelectPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    container,
    mounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    // alignmentOffset: optionTextOffset ?? alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    allowAxisFlip: false,
    // innerFallback,
  });

  const mergedRef = useForkRef(ref, setPositionerElement);

  const ownerState: SelectPositioner.OwnerState = React.useMemo(() => ({}), []);

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      positioner,
    }),
    [positioner],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPositionerProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    customStyleHookMapping: popupOpenStateMapping,
    extraProps: otherProps,
  });

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <FloatingPortal root={container}>
      <FloatingFocusManager
        context={positioner.positionerContext}
        modal={false}
        disabled={!mounted}
      >
        <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
          <SelectPositionerContext.Provider value={contextValue}>
            {renderElement()}
          </SelectPositionerContext.Provider>
        </CompositeList>
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

namespace SelectPositioner {
  export interface OwnerState {}

  export interface Props
    extends useSelectPositioner.SharedParameters,
      BaseUIComponentProps<'div', OwnerState> {}
}
