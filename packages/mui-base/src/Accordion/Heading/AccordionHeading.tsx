'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { AccordionSection } from '../Section/AccordionSection';
import { useAccordionSectionContext } from '../Section/AccordionSectionContext';
import { accordionStyleHookMapping } from '../Section/styleHooks';

const AccordionHeading = React.forwardRef(function AccordionHeading(
  props: AccordionHeading.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...otherProps } = props;

  const { ownerState } = useAccordionSectionContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h3',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

export { AccordionHeading };

export namespace AccordionHeading {
  export interface Props extends BaseUIComponentProps<'h3', AccordionSection.OwnerState> {}
}
