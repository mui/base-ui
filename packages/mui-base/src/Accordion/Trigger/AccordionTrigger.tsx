'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleContext } from '../../Collapsible/Root/CollapsibleContext';
import { useCollapsibleTrigger } from '../../Collapsible/Trigger/useCollapsibleTrigger';
import type { AccordionItem } from '../Item/AccordionItem';
import { useAccordionItemContext } from '../Item/AccordionItemContext';
import { accordionStyleHookMapping } from '../Item/styleHooks';

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
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { disabled: disabledProp, className, id, render, ...otherProps } = props;

  const { contentId, disabled: contextDisabled, open, setOpen } = useCollapsibleContext();

  const { getRootProps } = useCollapsibleTrigger({
    contentId,
    disabled: disabledProp || contextDisabled,
    id,
    open,
    rootRef: forwardedRef,
    setOpen,
  });

  const { ownerState, setTriggerId, triggerId } = useAccordionItemContext();

  useEnhancedEffect(() => {
    setTriggerId(id);
    return () => {
      setTriggerId(undefined);
    };
  }, [id, setTriggerId]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ownerState,
    className,
    extraProps: { ...otherProps, id: triggerId },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return renderElement();
});

namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionItem.OwnerState> {}
}

export { AccordionTrigger };

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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
