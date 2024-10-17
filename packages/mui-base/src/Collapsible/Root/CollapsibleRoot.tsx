'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRoot } from './useCollapsibleRoot';
import { CollapsibleRootContext } from './CollapsibleRootContext';
import { collapsibleStyleHookMapping } from './styleHooks';

/**
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.netlify.app/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsibleRoot API](https://base-ui.netlify.app/components/react-collapsible/#api-reference-CollapsibleRoot)
 */
const CollapsibleRoot = React.forwardRef(function CollapsibleRoot(
  props: CollapsibleRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    animated,
    children,
    className,
    defaultOpen,
    disabled,
    onOpenChange,
    open,
    render: renderProp,
    ...otherProps
  } = props;

  const collapsible = useCollapsibleRoot({
    animated,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
  });

  const ownerState: CollapsibleRoot.OwnerState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.transitionStatus],
  );

  const contextValue: CollapsibleRootContext = React.useMemo(
    () => ({
      ...collapsible,
      ownerState,
    }),
    [collapsible, ownerState],
  );

  const { renderElement } = useComponentRenderer({
    render: renderProp ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: { children, ...otherProps },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  if (!renderProp) {
    return (
      <CollapsibleRootContext.Provider value={contextValue}>
        {children}
      </CollapsibleRootContext.Provider>
    );
  }

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      {renderElement()}
    </CollapsibleRootContext.Provider>
  );
});

export { CollapsibleRoot };

export namespace CollapsibleRoot {
  export interface OwnerState
    extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}

  export interface Props
    extends useCollapsibleRoot.Parameters,
      BaseUIComponentProps<any, OwnerState> {}
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
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
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
