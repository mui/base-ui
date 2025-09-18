'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCollapsibleRoot } from './useCollapsibleRoot';
import { CollapsibleRootContext } from './CollapsibleRootContext';
import { collapsibleStateAttributesMapping } from './stateAttributesMapping';
import type { BaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export const CollapsibleRoot = React.forwardRef(function CollapsibleRoot(
  componentProps: CollapsibleRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    defaultOpen = false,
    disabled = false,
    onOpenChange: onOpenChangeProp,
    open,
    ...elementProps
  } = componentProps;

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

  // @ts-expect-error Collapsible accepts `render={null}`
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: collapsibleStateAttributesMapping,
  });

  if (componentProps.render !== null) {
    return (
      <CollapsibleRootContext.Provider value={contextValue}>
        {element}
      </CollapsibleRootContext.Provider>
    );
  }

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      {elementProps.children}
    </CollapsibleRootContext.Provider>
  );
});

export namespace CollapsibleRoot {
  export interface State extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled'> {}

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
    onOpenChange?: (open: boolean, eventDetails: ChangeEventDetails) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    render?: BaseUIComponentProps<'div', State>['render'] | null;
  }

  export type ChangeEventReason = 'trigger-press' | 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
