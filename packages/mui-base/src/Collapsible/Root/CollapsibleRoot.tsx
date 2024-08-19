'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useCollapsibleRoot } from './useCollapsibleRoot';
import { CollapsibleContext } from './CollapsibleContext';

export function CollapsibleRoot(props: CollapsibleRoot.Props) {
  const { animated, open, defaultOpen, onOpenChange, disabled, children } = props;

  const collapsible = useCollapsibleRoot({
    animated,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
  });

  const contextValue: CollapsibleRoot.Context = React.useMemo(
    () => ({
      ...collapsible,
      ownerState: {
        open: collapsible.open,
        disabled: collapsible.disabled,
        transitionStatus: collapsible.transitionStatus,
      },
    }),
    [collapsible],
  );

  return <CollapsibleContext.Provider value={contextValue}>{children}</CollapsibleContext.Provider>;
}

export namespace CollapsibleRoot {
  export interface Context extends useCollapsibleRoot.ReturnValue {
    ownerState: OwnerState;
  }

  export interface OwnerState
    extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}

  export interface Props extends useCollapsibleRoot.Parameters {
    children: React.ReactNode;
  }
}

CollapsibleRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the component supports CSS/JS-based animations and transitions.
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the Collapsible is initially open.
   * This is the uncontrolled counterpart of `open`.
   * @default true
   */
  defaultOpen: PropTypes.bool,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Callback fired when the Collapsible is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * If `true`, the Collapsible is initially open.
   * This is the controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
} as any;
