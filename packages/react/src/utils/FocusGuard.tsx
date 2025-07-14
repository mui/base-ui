'use client';
import * as React from 'react';
import { useModernLayoutEffect } from '@base-ui-components/utils/useModernLayoutEffect';
import { isSafari } from '@base-ui-components/utils/detectBrowser';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';

/**
 * @internal
 */
export const FocusGuard = React.forwardRef(function FocusGuard(
  props: React.ComponentPropsWithoutRef<'span'>,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const [role, setRole] = React.useState<'button' | undefined>();

  useModernLayoutEffect(() => {
    if (isSafari) {
      // Unlike other screen readers such as NVDA and JAWS, the virtual cursor
      // on VoiceOver does trigger the onFocus event, so we can use the focus
      // trap element. On Safari, only buttons trigger the onFocus event.
      setRole('button');
    }
  }, []);

  const restProps = {
    ref,
    tabIndex: 0,
    // Role is only for VoiceOver
    role,
    'aria-hidden': role ? undefined : true,
    style: visuallyHidden,
  };

  return <span {...props} {...restProps} data-base-ui-focus-guard="" />;
});
