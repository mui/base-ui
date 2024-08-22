'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { AccordionSection } from '../Section/AccordionSection';
import { useAccordionSectionContext } from '../Section/AccordionSectionContext';
import { accordionStyleHookMapping } from '../Section/styleHooks';
/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionHeading API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionHeading)
 */
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

AccordionHeading.propTypes /* remove-proptypes */ = {
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

export { AccordionHeading };

export namespace AccordionHeading {
  export interface Props extends BaseUIComponentProps<'h3', AccordionSection.OwnerState> {}
}
