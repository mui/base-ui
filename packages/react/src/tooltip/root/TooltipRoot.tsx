'use client';
import * as React from 'react';
import { TooltipRootContext } from './TooltipRootContext';
import { useTooltipRoot } from './useTooltipRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipRoot: React.FC<TooltipRoot.Props> = function TooltipRoot(props) {
  const {
    disabled = false,
    defaultOpen = false,
    onOpenChange,
    open,
    delay,
    closeDelay,
    hoverable = true,
    trackCursorAxis = 'none',
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const tooltipRoot = useTooltipRoot({
    ...props,
    defaultOpen,
    onOpenChange,
    open,
    hoverable,
    trackCursorAxis,
    delay,
    closeDelay,
    actionsRef,
    onOpenChangeComplete,
    disabled,
  });

  const contextValue: TooltipRootContext = React.useMemo(
    () => ({
      ...tooltipRoot,
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
      trackCursorAxis,
    }),
    [tooltipRoot, delayWithDefault, closeDelayWithDefault, trackCursorAxis],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
};

export namespace TooltipRoot {
  export interface State {}

  export interface Props extends useTooltipRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = useTooltipRoot.Actions;
}
