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
export function useSetFieldFocused(disabled: boolean | undefined) {
  const { setFocused, focusOwnerRef } = useFieldRootContext();

  const setFieldFocused = useStableCallback((focused: boolean) => {
    if (focused) {
      focusOwnerRef.current = setFieldFocused;
    }

    setFocused(focused);
  });

  // `disabled` is a dependency so that flipping it to `true` runs this cleanup, which is what
  // clears the focused state on the disable path as well as on unmount.
  useIsoLayoutEffect(() => {
    return () => {
      if (focusOwnerRef.current === setFieldFocused) {
        focusOwnerRef.current = undefined;
        setFocused(false);
      }
    };
  }, [disabled, focusOwnerRef, setFieldFocused, setFocused]);

  return setFieldFocused;
}
