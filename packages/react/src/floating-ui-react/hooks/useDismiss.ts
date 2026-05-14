'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { normalizeProp, useDismissCore, type UseDismissCoreProps } from './useDismissCore';

type PressType = 'intentional' | 'sloppy';

export { normalizeProp };

export interface UseDismissProps extends UseDismissCoreProps {
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   *
   * A lazy getter invoked when handling reference press events.
   * @default false
   */
  referencePress?: (() => boolean) | undefined;
  /**
   * The type of event to use to determine a "press".
   * - `down` is `pointerdown` on mouse input, but special iOS-like touch handling on touch input.
   * - `up` is lazy on both mouse + touch input (equivalent to `click`).
   * @default 'down'
   */
  referencePressEvent?: PressType | undefined;
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext | FloatingContext,
  props: UseDismissProps = {},
): ElementProps {
  const { enabled = true, referencePress, referencePressEvent = 'sloppy' } = props;
  const store = 'rootStore' in context ? context.rootStore : context;
  const dismiss = useDismissCore(context, props);

  const closeOnReferencePress = useStableCallback((event: React.SyntheticEvent) => {
    if (!referencePress?.()) {
      return;
    }

    store.setOpen(
      false,
      createChangeEventDetails(
        REASONS.triggerPress,
        event.nativeEvent as MouseEvent | PointerEvent | TouchEvent | KeyboardEvent,
      ),
    );
  });

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      ...dismiss.reference,
      [referencePressEvent === 'intentional' ? 'onClick' : 'onPointerDown']: closeOnReferencePress,
      ...(referencePressEvent !== 'intentional' && {
        onClick: closeOnReferencePress,
      }),
    }),
    [dismiss.reference, closeOnReferencePress, referencePressEvent],
  );

  return React.useMemo(
    () => (enabled ? { ...dismiss, reference, trigger: reference } : {}),
    [dismiss, enabled, reference],
  );
}
