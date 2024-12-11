'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsibleTrigger } from '../../collapsible/trigger/useCollapsibleTrigger';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
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
    open,
    rootRef: forwardedRef,
    setOpen,
  });

  const { state, setTriggerId, triggerId } = useAccordionItemContext();

  useEnhancedEffect(() => {
    setTriggerId(id);
    return () => {
      setTriggerId(undefined);
    };
  }, [id, setTriggerId]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    state,
    className,
    extraProps: {
      ...otherProps,
      // the `id` prop doesn't go here directly, it updates a context
      // and becomes `triggerId`
      id: triggerId,
    },
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionItem.State> {}
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
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
   * Allows you to replace the default HTML element that the component
   * renders with another element, or compose it with another component.
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
