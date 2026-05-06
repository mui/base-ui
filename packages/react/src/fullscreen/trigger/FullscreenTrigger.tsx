'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from '../../internals/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import { type FullscreenRootState } from '../root/FullscreenRoot';
import { fullscreenStateMapping } from '../root/stateAttributesMapping';
import { FullscreenHandle } from '../store/FullscreenHandle';
import { useFullscreenTriggerRegistration } from './useFullscreenTriggerRegistration';

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
    className,
    disabled: disabledProp,
    handle,
    id: idProp,
    nativeButton = true,
    render,
    style,
    ...elementProps
  } = componentProps;

  const rootContext = useFullscreenRootContext(true);
  const store = handle?.store ?? rootContext?.store;
  if (!store) {
    throw new Error(
      'Base UI: <Fullscreen.Trigger> must be used within <Fullscreen.Root> or provided with a handle.',
    );
  }

  const thisTriggerId = useBaseUiId(idProp);
  const containerId = store.useState('containerId');
  const supported = store.useState('supported');
  const contextDisabled = store.useState('disabled');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);

  // The trigger is unusable while the Fullscreen API is not supported by the
  // owner document, so we surface that as `disabled` to assistive tech and
  // visually via the standard `data-disabled` attribute.
  const disabled = (disabledProp ?? contextDisabled) || !supported;

  const triggerElementRef = React.useRef<HTMLElement | null>(null);
  const registerTrigger = useFullscreenTriggerRegistration(thisTriggerId, store);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const handleClick = useStableCallback((event: React.MouseEvent) => {
    if (disabled) {
      return;
    }
    const next = !store.select('open');
    const triggerElement = triggerElementRef.current ?? undefined;
    store.setOpen(
      next,
      createChangeEventDetails(REASONS.triggerPress, event.nativeEvent, triggerElement),
    );
  });

  const state: FullscreenTriggerState = React.useMemo(
    () => ({
      open: isOpenedByThisTrigger,
      disabled,
      supported,
    }),
    [isOpenedByThisTrigger, disabled, supported],
  );

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, registerTrigger, triggerElementRef],
    props: [
      {
        'aria-controls': containerId,
        'aria-pressed': isOpenedByThisTrigger,
        id: thisTriggerId,
        onClick: handleClick,
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping: fullscreenStateMapping,
  });
});

export interface FullscreenTriggerState extends FullscreenRootState {}

export interface FullscreenTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', FullscreenTriggerState> {
  /**
   * A handle to associate the trigger with a fullscreen root rendered
   * elsewhere in the tree. Create one with `Fullscreen.createHandle()`.
   */
  handle?: FullscreenHandle | undefined;
  /**
   * ID of the trigger. Forwarded to the rendered element and used internally
   * to identify which trigger activated the fullscreen.
   */
  id?: string | undefined;
}

export namespace FullscreenTrigger {
  export type State = FullscreenTriggerState;
  export type Props = FullscreenTriggerProps;
}
