'use client';
import * as React from 'react';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

export const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  componentProps: AccordionTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { disabled: disabledProp, className, id: idProp, render, ...elementProps } = componentProps;

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();

  const disabled = disabledProp ?? contextDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const { state, setTriggerId, triggerId: id } = useAccordionItemContext();

  useModernLayoutEffect(() => {
    if (idProp) {
      setTriggerId(idProp);
    }
    return () => {
      setTriggerId(undefined);
    };
  }, [idProp, setTriggerId]);

  const props = React.useMemo(
    () => ({
      'aria-controls': panelId,
      'aria-expanded': open,
      disabled,
      id,
      onClick: handleTrigger,
    }),
    [panelId, disabled, id, open, handleTrigger],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return element;
});

export namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionItem.State> {}
}
