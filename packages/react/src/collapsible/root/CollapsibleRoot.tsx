'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useCollapsibleRoot } from './useCollapsibleRoot';
import { CollapsibleRootContext } from './CollapsibleRootContext';
import { collapsibleStyleHookMapping } from './styleHooks';

/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export const CollapsibleRoot = React.forwardRef(function CollapsibleRoot(
  props: CollapsibleRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultOpen = false,
    disabled = false,
    onOpenChange: onOpenChangeProp,
    open,
    render: renderProp,
    ...otherProps
  } = props;

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const collapsible = useCollapsibleRoot({
    open,
    defaultOpen,
    onOpenChange,
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
      onOpenChange,
      state,
    }),
    [collapsible, onOpenChange, state],
  );

  const { renderElement } = useComponentRenderer({
    render: renderProp ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
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
      {otherProps.children}
    </CollapsibleRootContext.Provider>
  );
});

export namespace CollapsibleRoot {
  export interface State
    extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'render'> {
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: boolean;
    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    render?: BaseUIComponentProps<'div', State>['render'] | null;
  }
}
