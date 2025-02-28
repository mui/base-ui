'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PopoverRootContext } from './PopoverRootContext';
import { usePopoverRoot } from './usePopoverRoot';
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
  });

  const contextValue: PopoverRootContext = React.useMemo(
    () => ({
      ...popoverRoot,
      openOnHover,
      delay: delayWithDefault,
      closeDelay,
    }),
    [popoverRoot, openOnHover, delayWithDefault, closeDelay],
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
}

PopoverRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   */
  actionsRef: PropTypes.shape({
    current: PropTypes.shape({
      unmount: PropTypes.func.isRequired,
    }).isRequired,
  }),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * How long to wait before closing the popover that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay: PropTypes.number,
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * How long to wait before the popover may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 300
   */
  delay: PropTypes.number,
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Event handler called after any animations complete when the popover is opened or closed.
   */
  onOpenChangeComplete: PropTypes.func,
  /**
   * Whether the popover is currently open.
   */
  open: PropTypes.bool,
  /**
   * Whether the popover should also open when the trigger is hovered.
   * @default false
   */
  openOnHover: PropTypes.bool,
} as any;

export { PopoverRoot };
