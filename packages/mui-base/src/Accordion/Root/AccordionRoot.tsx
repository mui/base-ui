'use client';
import * as React from 'react';
import { FloatingList } from '@floating-ui/react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useAccordionRoot } from './useAccordionRoot';
import { AccordionRootContext } from './AccordionRootContext';

const AccordionRoot = React.forwardRef(function AccordionRoot(
  props: AccordionRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { animated, disabled, defaultValue, value, className, render, ...otherProps } = props;

  const { getRootProps, ...accordion } = useAccordionRoot({
    animated,
    disabled,
    defaultValue,
    value,
  });

  const ownerState: AccordionRoot.OwnerState = React.useMemo(
    () => ({
      value: accordion.value,
      disabled: accordion.disabled,
      // transitionStatus: accordion.transitionStatus,
    }),
    [accordion.value, accordion.disabled],
  );

  const contextValue: AccordionRoot.Context = React.useMemo(
    () => ({
      ...accordion,
      ownerState,
    }),
    [accordion, ownerState],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: {
      value: () => null,
    },
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <FloatingList elementsRef={accordion.accordionSectionRefs}>{renderElement()}</FloatingList>
    </AccordionRootContext.Provider>
  );
});

export { AccordionRoot };

export namespace AccordionRoot {
  export interface Context extends Omit<useAccordionRoot.ReturnValue, 'getRootProps'> {
    ownerState: OwnerState;
  }

  export interface OwnerState {
    value: useAccordionRoot.Value;
    disabled: boolean;
  }

  export interface Props
    extends useAccordionRoot.Parameters,
      BaseUIComponentProps<any, OwnerState> {}
}
