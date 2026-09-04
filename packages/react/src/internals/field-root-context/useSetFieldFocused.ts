'use client';
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
  onFocusedChange?: ((focused: boolean) => void) | undefined,
) {
  const { setFocused, focusOwnerRef } = useFieldRootContext();

  const setFieldFocused = useStableCallback((focused: boolean) => {
    // A disabled target can still be focused (`aria-disabled` elements stay programmatically
    // focusable), but must not publish the field's focused styling.
    if (focused && disabled) {
      return;
    }

    if (!focused && focusOwnerRef.current !== setFieldFocused) {
      return;
    }

    focusOwnerRef.current = focused ? setFieldFocused : undefined;
    onFocusedChange?.(focused);
    setFocused(focused);
  });

  // Re-run the cleanup when `disabled` changes so a focused control releases the field even when
  // the browser does not fire `blur`.
  useIsoLayoutEffect(() => () => setFieldFocused(false), [disabled, setFieldFocused]);

  return setFieldFocused;
}
