'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionMapping } from '../item/stateAttributesMapping';

/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionHeader = React.forwardRef(function AccordionHeader(
  componentProps: AccordionHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { state } = useAccordionItemContext();

  const element = useRenderElement('h3', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: accordionMapping,
  });

  return element;
});

export namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.State> {}
}
