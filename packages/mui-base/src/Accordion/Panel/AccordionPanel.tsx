'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCollapsibleContent } from '../../Collapsible/Content/useCollapsibleContent';
import type { AccordionSection } from '../Section/AccordionSection';
import { useAccordionSectionContext } from '../Section/AccordionSectionContext';
import { accordionStyleHookMapping } from '../Section/styleHooks';

export const AccordionPanel = React.forwardRef(function AccordionPanel(
  props: AccordionPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, htmlHidden, render, ...otherProps } = props;

  const { animated, mounted, open, contentId, setContentId, setMounted, setOpen } =
    useCollapsibleContext();

  const { getRootProps, height } = useCollapsibleContent({
    animated,
    htmlHidden,
    id: contentId,
    mounted,
    open,
    ref: forwardedRef,
    setContentId,
    setMounted,
    setOpen,
  });

  const { ownerState } = useAccordionSectionContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: {
      ...otherProps,
      style: {
        '--accordion-content-height': height ? `${height}px` : undefined,
      },
    },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

export namespace AccordionPanel {
  export interface Props
    extends BaseUIComponentProps<'div', AccordionSection.OwnerState>,
      Pick<useCollapsibleContent.Parameters, 'htmlHidden'> {}
}
