'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCollapsibleTrigger } from '../../Collapsible/Trigger/useCollapsibleTrigger';
import type { AccordionSection } from '../Section/AccordionSection';
import { useAccordionSectionContext } from '../Section/AccordionSectionContext';
import { accordionStyleHookMapping } from '../Section/styleHooks';

const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  props: AccordionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ...otherProps } = props;

  const { contentId, open, setOpen } = useCollapsibleContext();

  const { getRootProps } = useCollapsibleTrigger({
    contentId,
    open,
    setOpen,
  });

  const { ownerState } = useAccordionSectionContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

export { AccordionTrigger };

namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionSection.OwnerState> {}
}
