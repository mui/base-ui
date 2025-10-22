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

  const { store } = useTooltipRootContext();

  const open = store.useState('open');
  const triggerProps = store.useState('triggerProps');

  const state: TooltipTrigger.State = React.useMemo(() => ({ open }), [open]);

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, store.getElementSetter('triggerElement')],
    props: [triggerProps, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
});

export interface TooltipTriggerState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
}

export interface TooltipTriggerProps extends BaseUIComponentProps<'button', TooltipTrigger.State> {}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props = TooltipTriggerProps;
}
