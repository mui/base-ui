'use client';
import * as React from 'react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  componentProps: TooltipTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { open, setTriggerElement, getTriggerProps } = useTooltipRootContext();

  const state: TooltipTrigger.State = React.useMemo(() => ({ open }), [open]);

  const renderElement = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement],
    props: [getTriggerProps, elementProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

export namespace TooltipTrigger {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
