'use client';
import * as React from 'react';
import { PopoverRootContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverRoot: React.FC<PopoverRoot.Props> = function PopoverRoot(props) {
  const popoverRoot = usePopoverRoot(props);
  return (
    <PopoverRootContext.Provider value={popoverRoot}>{props.children}</PopoverRootContext.Provider>
  );
};

export namespace PopoverRoot {
  export interface State {}

  export interface Props extends usePopoverRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = usePopoverRoot.Actions;
}
