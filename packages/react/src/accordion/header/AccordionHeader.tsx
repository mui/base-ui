'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';

/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
const AccordionHeader = React.forwardRef(function AccordionHeader(
  props: AccordionHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...other } = props;

  const { state } = useAccordionItemContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h3',
    state,
    className,
    ref: forwardedRef,
    extraProps: other,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.State> {}
}

export { AccordionHeader };
