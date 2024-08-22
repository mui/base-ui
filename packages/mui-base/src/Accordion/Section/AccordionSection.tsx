'use client';
import * as React from 'react';
import { useListItem } from '@floating-ui/react';
import { useForkRef } from '../../utils/useForkRef';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useCollapsibleRoot } from '../../Collapsible/Root/useCollapsibleRoot';
import type { CollapsibleRoot } from '../../Collapsible/Root/CollapsibleRoot';
import { CollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import type { AccordionRoot } from '../Root/AccordionRoot';
import { useAccordionRootContext } from '../Root/AccordionRootContext';
import { AccordionSectionContext } from './AccordionSectionContext';
// import { useAccordionSection } from './useAccordionSection';
import { accordionStyleHookMapping } from './styleHooks';

const AccordionSection = React.forwardRef(function AccordionSection(
  props: AccordionSection.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value: valueProp, ...otherProps } = props;

  const sectionRef = React.useRef<HTMLElement>(null);
  const { ref: listItemRef, index } = useListItem();
  const mergedRef = useForkRef(forwardedRef, listItemRef, sectionRef);

  const {
    animated,
    disabled,
    handleOpenChange,
    ownerState: rootOwnerState,
    value: openValues,
  } = useAccordionRootContext();

  const value = valueProp ?? index;

  const isOpen = React.useMemo(() => {
    if (!openValues) {
      return false;
    }

    for (let i = 0; i < openValues.length; i += 1) {
      if (openValues[i] === value) {
        return true;
      }
    }

    return false;
  }, [openValues, value]);

  const collapsible = useCollapsibleRoot({
    animated,
    open: isOpen,
    onOpenChange: (nextOpen) => handleOpenChange(value, nextOpen),
    disabled,
  });

  const collapsibleOwnerState: CollapsibleRoot.OwnerState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.transitionStatus],
  );

  const collapsibleContext: CollapsibleRoot.Context = React.useMemo(
    () => ({
      ...collapsible,
      ownerState: collapsibleOwnerState,
    }),
    [collapsible, collapsibleOwnerState],
  );

  const ownerState: AccordionSection.OwnerState = React.useMemo(
    () => ({
      ...rootOwnerState,
      index,
      open: isOpen,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.transitionStatus, index, isOpen, rootOwnerState],
  );

  const accordionSectionContext: AccordionSection.Context = React.useMemo(
    () => ({
      open: isOpen,
      ownerState,
    }),
    [isOpen, ownerState],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return (
    <CollapsibleContext.Provider value={collapsibleContext}>
      <AccordionSectionContext.Provider value={accordionSectionContext}>
        {renderElement()}
      </AccordionSectionContext.Provider>
    </CollapsibleContext.Provider>
  );
});

export { AccordionSection };

export namespace AccordionSection {
  export interface Context {
    open: boolean;
    ownerState: OwnerState;
  }

  export interface OwnerState extends AccordionRoot.OwnerState {
    index: number;
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<any, OwnerState> {
    value: number | string;
  }
}
