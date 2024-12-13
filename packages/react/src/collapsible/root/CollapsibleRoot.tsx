'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRoot } from './useCollapsibleRoot';
import { CollapsibleRootContext } from './CollapsibleRootContext';
import { collapsibleStyleHookMapping } from './styleHooks';

/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
const CollapsibleRoot = React.forwardRef(function CollapsibleRoot(
  props: CollapsibleRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    className,
    defaultOpen = false,
    disabled = false,
    onOpenChange: onOpenChangeProp,
    open,
    render: renderProp,
    ...otherProps
  } = props;

  const collapsible = useCollapsibleRoot({
    open,
    defaultOpen,
    onOpenChange: onOpenChangeProp ?? NOOP,
    disabled,
  });

  const state: CollapsibleRoot.State = React.useMemo(
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
      state,
    }),
    [collapsible, state],
  );

  const { renderElement } = useComponentRenderer({
    render: renderProp ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: { children, ...otherProps },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  if (renderProp !== null) {
    return (
      <CollapsibleRootContext.Provider value={contextValue}>
        {renderElement()}
      </CollapsibleRootContext.Provider>
    );
  }

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      {children}
    </CollapsibleRootContext.Provider>
  );
});

export { CollapsibleRoot };

export namespace CollapsibleRoot {
  export interface State
    extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}

  export interface Props
    extends Partial<useCollapsibleRoot.Parameters>,
      Omit<BaseUIComponentProps<'div', State>, 'render'> {
    render?: BaseUIComponentProps<'div', State>['render'] | null;
  }
}

CollapsibleRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether the collapsible panel is initially open.
   *
   * To render a controlled collapsible, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the collapsible panel is currently open.
   *
   * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
   */
  open: PropTypes.bool,
  /**
   * @ignore
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
