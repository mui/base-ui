'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFieldRootContext } from './FieldRootContext';

/**
 * Returns the field's `setFocused`, recording which control the focused state belongs to.
 *
 * Disabling or unmounting a focused control moves focus away without firing `blur`, so the focused
 * state would otherwise stay latched. A field can hold several controls, so a control only clears
 * the shared state when focus last landed on itself. The stable callback doubles as that identity.
 */
export function useSetFieldFocused(
  disabled: boolean | undefined,
  onFocusedChange?: ((focused: boolean) => void) | undefined,
) {
  const { setFocused, focusOwnerRef } = useFieldRootContext();

  const setFieldFocused = useStableCallback((focused: boolean) => {
    if (!focused && focusOwnerRef.current !== setFieldFocused) {
      return;
    }

    focusOwnerRef.current = focused ? setFieldFocused : undefined;
    onFocusedChange?.(focused);
    setFocused(focused);
  });

  // Only the disable edge clears: the enable edge must keep the state, since focus can sit on
  // an `aria-disabled` control that stays focused when it is re-enabled.
  useIsoLayoutEffect(() => {
    if (disabled && focusOwnerRef.current === setFieldFocused) {
      setFieldFocused(false);
    }
  }, [disabled, focusOwnerRef, setFieldFocused]);

  useIsoLayoutEffect(() => {
    return () => {
      if (focusOwnerRef.current === setFieldFocused) {
        setFieldFocused(false);
      }
    };
  }, [focusOwnerRef, setFieldFocused]);

  return setFieldFocused;
}
