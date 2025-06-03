'use client';
import * as React from 'react';
import { TooltipRootContext } from './TooltipRootContext';
import { type TooltipOpenChangeReason, useTooltipRoot } from './useTooltipRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipRoot(props: TooltipRoot.Props) {
  const {
    disabled = false,
    defaultOpen = false,
    onOpenChange,
    open,
    delay,
    closeDelay,
    hoverable = true,
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
      disabled,
      hoverable,
    }),
    [tooltipRoot, delayWithDefault, closeDelayWithDefault, disabled, hoverable],
  );

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
}

export namespace TooltipRoot {
  export interface State {}

  export interface Props extends useTooltipRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = useTooltipRoot.Actions;

  export type OpenChangeReason = TooltipOpenChangeReason;
}
