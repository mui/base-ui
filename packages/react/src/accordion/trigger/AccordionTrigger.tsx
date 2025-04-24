'use client';
import * as React from 'react';
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

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();

  const { getRootProps } = useCollapsibleTrigger({
    disabled: disabledProp ?? contextDisabled,
    panelId,
    open,
    handleTrigger,
    rootRef: forwardedRef,
  });

  const { state, setTriggerId, triggerId } = useAccordionItemContext();

  useEnhancedEffect(() => {
    if (id) {
      setTriggerId(id);
    }
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
