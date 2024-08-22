'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCollapsibleTrigger } from '../../Collapsible/Trigger/useCollapsibleTrigger';
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
 * - [AccordionTrigger API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionTrigger)
 */
const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  props: AccordionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { disabled: disabledProp, className, render, ...otherProps } = props;

  const { contentId, disabled: contextDisabled, open, setOpen } = useCollapsibleContext();

  const { getRootProps } = useCollapsibleTrigger({
    contentId,
    open,
    setOpen,
    disabled: disabledProp || contextDisabled,
  });

  const { ownerState, triggerId } = useAccordionSectionContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: { ...otherProps, id: triggerId },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

AccordionTrigger.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AccordionTrigger };

namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionSection.OwnerState> {}
}
