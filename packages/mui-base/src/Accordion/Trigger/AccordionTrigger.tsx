'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import { BaseUIComponentProps } from '../../utils/types.js';
import { useCollapsibleRootContext } from '../../Collapsible/Root/CollapsibleRootContext.js';
import { useCollapsibleTrigger } from '../../Collapsible/Trigger/useCollapsibleTrigger.js';
import type { AccordionItem } from '../Item/AccordionItem.js';
import { useAccordionItemContext } from '../Item/AccordionItemContext.js';

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

  const { panelId, disabled: contextDisabled, open, setOpen } = useCollapsibleRootContext();

  const { getRootProps } = useCollapsibleTrigger({
    panelId,
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
    customStyleHookMapping: triggerOpenStateMapping,
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
