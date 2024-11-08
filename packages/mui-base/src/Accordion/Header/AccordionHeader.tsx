'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import type { AccordionItem } from '../Item/AccordionItem.js';
import { useAccordionItemContext } from '../Item/AccordionItemContext.js';
import { accordionStyleHookMapping } from '../Item/styleHooks.js';

/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionHeader API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionHeader)
 */
const AccordionHeader = React.forwardRef(function AccordionHeader(
  props: AccordionHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...other } = props;

  const { ownerState } = useAccordionItemContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h3',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: other,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

export namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.OwnerState> {}
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
