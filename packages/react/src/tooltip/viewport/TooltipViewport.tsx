'use client';
import * as React from 'react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupViewport } from '../../utils/popups/viewport/usePopupViewport';

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipViewport = React.forwardRef(function TooltipViewport(
  componentProps: TooltipViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = useTooltipRootContext();
  const { side } = useTooltipPositionerContext();

  return usePopupViewport({
    componentProps,
    forwardedRef,
    store,
    side,
  });
});

export interface TooltipViewportState {
  /**
   * The activation direction of the transitioned content.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
  /**
   * Present if animations should be instant.
   */
  instant: 'delay' | 'dismiss' | 'focus' | undefined;
}

export interface TooltipViewportProps extends BaseUIComponentProps<'div', TooltipViewportState> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
}

export namespace TooltipViewport {
  export type Props = TooltipViewportProps;
  export type State = TooltipViewportState;
}
