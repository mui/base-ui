'use client';
import type * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useButton } from '../../internals/use-button';
import { useRenderElement } from '../../internals/useRenderElement';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';

export function useCollapsibleTrigger<State extends Record<string, any>>(
  componentProps: BaseUIComponentProps<'button', State> & NativeButtonProps,
  forwardedRef: React.ForwardedRef<any>,
  stateAttributesMapping: StateAttributesMapping<State>,
  itemState?: State,
) {
  const {
    className,
    disabled: disabledProp,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const { panelId, handleTrigger, state: collapsibleState } = useCollapsibleRootContext();
  const { open, disabled: contextDisabled } = collapsibleState;

  const disabled = disabledProp || contextDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  return useRenderElement('button', componentProps, {
    state: { ...(itemState ?? (collapsibleState as unknown as State)), disabled },
    ref: [forwardedRef, buttonRef],
    props: [
      {
        'aria-controls': open ? panelId : undefined,
        'aria-expanded': open,
        onClick: handleTrigger,
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });
}
