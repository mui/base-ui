'use client';
import * as React from 'react';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { NativeButtonComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import { CollapsibleRoot } from '../root/CollapsibleRoot';

const stateAttributesMapping: StateAttributesMapping<CollapsibleRoot.State> = {
  ...triggerOpenStateMapping,
  ...transitionStatusMapping,
};

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export const CollapsibleTrigger = React.forwardRef(function CollapsibleTrigger(
  componentProps: CollapsibleTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    panelId,
    open,
    handleTrigger,
    state,
    disabled: contextDisabled,
  } = useCollapsibleRootContext();

  const {
    className,
    disabled = contextDisabled,
    id,
    render,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const props = React.useMemo(
    () => ({
      'aria-controls': open ? panelId : undefined,
      'aria-expanded': open,
      onClick: handleTrigger,
    }),
    [panelId, open, handleTrigger],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping,
  });

  return element;
}) as CollapsibleTriggerComponent;

export type CollapsibleTriggerProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, CollapsibleRoot.State>;

export namespace CollapsibleTrigger {
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = CollapsibleTriggerProps<TNativeButton, TElement>;
}

type CollapsibleTriggerComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: CollapsibleTrigger.Props<TNativeButton, TElement> & {
    ref?: React.Ref<HTMLButtonElement> | undefined;
  },
) => React.ReactElement | null;
