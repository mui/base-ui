'use client';
import * as React from 'react';
import { PopoverRootContext } from './PopoverRootContext';
import { type PopoverOpenChangeReason, usePopoverRoot } from './usePopoverRoot';
import { OPEN_DELAY } from '../utils/constants';

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverRoot: React.FC<PopoverRoot.Props> = function PopoverRoot(props) {
  const {
    defaultOpen = false,
    onOpenChange,
    open,
    openOnHover = false,
    delay,
    closeDelay = 0,
    actionsRef,
    onOpenChangeComplete,
    modal = false,
  } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;

  const popoverRoot = usePopoverRoot({
    ...props,
    defaultOpen,
    onOpenChange,
    open,
    openOnHover,
    onOpenChangeComplete,
    delay: delayWithDefault,
    closeDelay,
    actionsRef,
    modal,
  });

  const contextValue: PopoverRootContext = React.useMemo(
    () => ({
      ...popoverRoot,
      openOnHover,
      delay: delayWithDefault,
      closeDelay,
      modal,
    }),
    [popoverRoot, openOnHover, delayWithDefault, closeDelay, modal],
  );

  return (
    <PopoverRootContext.Provider value={contextValue}>{props.children}</PopoverRootContext.Provider>
  );
};

namespace PopoverRoot {
  export interface State {}

  export interface Props extends usePopoverRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = usePopoverRoot.Actions;

  export type OpenChangeReason = PopoverOpenChangeReason;
}

export { PopoverRoot };
