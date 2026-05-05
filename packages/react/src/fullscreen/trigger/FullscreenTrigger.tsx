'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import { type FullscreenRootState } from '../root/FullscreenRoot';
import { fullscreenStateMapping } from '../root/stateAttributesMapping';

/**
 * A button that toggles the fullscreen state of the container.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export const FullscreenTrigger = React.forwardRef(function FullscreenTrigger(
  componentProps: FullscreenTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    containerId,
    disabled: contextDisabled,
    handleTrigger,
    open,
    state: rootState,
    supported,
  } = useFullscreenRootContext();

  const {
    className,
    disabled: disabledProp = contextDisabled,
    nativeButton = true,
    render,
    style,
    ...elementProps
  } = componentProps;

  // The trigger is unusable while the Fullscreen API is not supported by the
  // owner document, so we surface that as `disabled` to assistive tech and
  // visually via the standard `data-disabled` attribute.
  const disabled = disabledProp || !supported;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const state: FullscreenTriggerState = React.useMemo(
    () => ({
      ...rootState,
      disabled,
    }),
    [rootState, disabled],
  );

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        'aria-controls': containerId,
        'aria-pressed': open,
        onClick: handleTrigger,
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping: fullscreenStateMapping,
  });
});

export interface FullscreenTriggerState extends FullscreenRootState {}

export interface FullscreenTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', FullscreenTriggerState> {}

export namespace FullscreenTrigger {
  export type State = FullscreenTriggerState;
  export type Props = FullscreenTriggerProps;
}
