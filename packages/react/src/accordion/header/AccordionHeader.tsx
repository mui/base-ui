'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';

/**
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

export namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.State> {}
}

export { AccordionHeader };

AccordionHeader.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
