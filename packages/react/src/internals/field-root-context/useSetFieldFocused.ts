'use client';
import type * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFieldRootContext } from './FieldRootContext';

/**
 * Returns the field's `setFocused`, recording which control the focused state belongs to.
 *
 * Disabling or unmounting a focused control moves focus away without firing `blur`, so the focused
 * state would otherwise stay latched. A field can have several focus targets, so a control only
 * clears the shared state when focus last landed on itself. The stable callback doubles as that
 * identity.
 */
export function useSetFieldFocused(
  disabled: boolean | undefined,
  focusTargetRef: React.RefObject<Element | null>,
  onFocusedChange?: ((focused: boolean) => void) | undefined,
) {
  const { setFocused, focusOwnerRef } = useFieldRootContext();

  const setFieldFocused = useStableCallback((focused: boolean) => {
    // A disabled target can still be focused (`aria-disabled` elements stay programmatically
    // focusable), but must not publish the field's focused styling.
    if (focused ? !disabled : focusOwnerRef.current === setFieldFocused) {
      focusOwnerRef.current = focused && setFieldFocused;
      onFocusedChange?.(focused);
      setFocused(focused);
    }
  });

  // Re-run when `disabled` changes so a focused control releases the field even when the browser
  // does not fire `blur`. The setup reclaims focus that no focus event reported: StrictMode
  // re-running effects after a mount-time focus, a control focused before hydration, or an
  // `aria-disabled` control re-enabled while it kept focus.
  useIsoLayoutEffect(() => {
    const el = focusTargetRef.current;
    const root = el?.getRootNode() as Document | ShadowRoot | undefined;
    if (root?.activeElement === el) {
      setFieldFocused(true);
    }
    return () => setFieldFocused(false);
  }, [disabled, focusTargetRef, setFieldFocused]);

  return setFieldFocused;
}
