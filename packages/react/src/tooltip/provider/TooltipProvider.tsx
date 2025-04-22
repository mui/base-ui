'use client';
import * as React from 'react';
import { NextFloatingDelayGroup } from '@floating-ui/react';
import { TooltipProviderContext } from './TooltipProviderContext';

/**
 * Provides a shared delay for multiple tooltips. The grouping logic ensures that
 * once a tooltip becomes visible, the adjacent tooltips will be shown instantly.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipProvider: React.FC<TooltipProvider.Props> = function TooltipProvider(props) {
  const { delay, closeDelay, timeout = 400 } = props;

  const contextValue: TooltipProviderContext = React.useMemo(
    () => ({
      delay,
      closeDelay,
    }),
    [delay, closeDelay],
  );

  return (
    <TooltipProviderContext.Provider value={contextValue}>
      <NextFloatingDelayGroup delay={{ open: delay, close: closeDelay }} timeoutMs={timeout}>
        {props.children}
      </NextFloatingDelayGroup>
    </TooltipProviderContext.Provider>
  );
};

namespace TooltipProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * How long to wait before opening a tooltip. Specified in milliseconds.
     */
    delay?: number;
    /**
     * How long to wait before closing a tooltip. Specified in milliseconds.
     */
    closeDelay?: number;
    /**
     * Another tooltip will open instantly if the previous tooltip
     * is closed within this timeout. Specified in milliseconds.
     * @default 400
     */
    timeout?: number;
  }
}

export { TooltipProvider };
