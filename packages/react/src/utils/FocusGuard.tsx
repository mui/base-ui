'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { platform } from '@base-ui/utils/platform';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';

/**
 * @internal
 */
export const FocusGuard = React.forwardRef(function FocusGuard(
  props: React.ComponentPropsWithoutRef<'span'>,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const [role, setRole] = React.useState<'button' | undefined>();

  useIsoLayoutEffect(() => {
    // Unlike NVDA and JAWS, VoiceOver's virtual cursor triggers `onFocus` as
    // it moves — but only on focusable/role-button elements, and only on
    // engines that route AX through macOS NSAccessibility (WebKit and Blink).
    // Firefox on macOS uses Gecko's own AX integration and is excluded.
    if (platform.screenReader.voiceOver && (platform.engine.webkit || platform.engine.blink)) {
      setRole('button');
    }
  }, []);

  const restProps = {
    tabIndex: 0,
    // Role is only for VoiceOver
    role,
  };

  return (
    <span
      {...props}
      ref={ref}
      style={visuallyHidden}
      aria-hidden={role ? undefined : true}
      {...restProps}
      data-base-ui-focus-guard=""
    />
  );
});
