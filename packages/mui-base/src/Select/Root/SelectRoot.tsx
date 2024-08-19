'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectRootContext } from './SelectRootContext';
import { useSelectRoot } from './useSelectRoot';

function SelectRoot(props: SelectRoot.Props) {
  const {
    animated = true,
    children,
    defaultOpen = false,
    disabled = false,
    loop = true,
    onOpenChange,
    open,
    alignMethod = 'selected-item',
  } = props;

  const selectRoot = useSelectRoot({
    animated,
    disabled,
    onOpenChange,
    loop,
    defaultOpen,
    open,
    alignMethod,
  });

  const context: SelectRootContext = React.useMemo(
    () => ({
      ...selectRoot,
      disabled,
      alignMethod,
    }),
    [selectRoot, disabled, alignMethod],
  );

  return <SelectRootContext.Provider value={context}>{children}</SelectRootContext.Provider>;
}

namespace SelectRoot {
  export interface Props {
    /**
     * If `true`, the Menu supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     *
     * @default true
     */
    animated?: boolean;
    children: React.ReactNode;
    /**
     * If `true`, the Menu is initially open.
     *
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     * @default true
     */
    loop?: boolean;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange?: (open: boolean, event: Event | undefined) => void;
    /**
     * Allows to control whether the dropdown is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * If `true`, the Menu is disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines the type of alignment mode. `selected-item` aligns the popup so that the selected
     * item appears over the trigger, while `trigger` aligns the popup using standard anchor
     * positioning.
     * @default 'selected-item'
     */
    alignMethod?: 'trigger' | 'selected-item';
  }
}

SelectRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Determines the type of alignment mode. `selected-item` aligns the popup so that the selected
   * item appears over the trigger, while `trigger` aligns the popup using standard anchor
   * positioning.
   * @default 'selected-item'
   */
  alignMethod: PropTypes.oneOf(['selected-item', 'trigger']),
  /**
   * If `true`, the Menu supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the Menu is initially open.
   *
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * If `true`, the Menu is disabled.
   *
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
} as any;

export { SelectRoot };
