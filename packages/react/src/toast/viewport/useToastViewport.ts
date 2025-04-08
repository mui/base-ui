'use client';
import * as React from 'react';
import { activeElement, contains, getTarget } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { isFocusVisible } from '../utils/focusVisible';
import { useLatestRef } from '../../utils/useLatestRef';
import { mergeProps } from '../../merge-props';

export function useToastViewport() {
  const {
    toasts,
    pauseTimers,
    resumeTimers,
    setHovering,
    setFocused,
    viewportRef,
    focused,
    windowFocusedRef,
    prevFocusElement,
    setPrevFocusElement,
  } = useToastContext();

  const handlingFocusGuardRef = React.useRef(false);
  const focusedRef = useLatestRef(focused);
  const numToasts = toasts.length;

  // Listen globally for F6 so we can force-focus the viewport.
  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (numToasts === 0) {
        return;
      }

      if (event.key === 'F6' && event.target !== viewportRef.current) {
        event.preventDefault();
        setPrevFocusElement(
          activeElement(ownerDocument(viewportRef.current)) as HTMLElement | null,
        );
        viewportRef.current?.focus();
        pauseTimers();
        setFocused(true);
      }
    }

    const win = ownerWindow(viewportRef.current);

    win.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      win.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [pauseTimers, setFocused, setPrevFocusElement, numToasts, viewportRef]);

  React.useEffect(() => {
    if (!viewportRef.current || !numToasts) {
      return undefined;
    }

    const win = ownerWindow(viewportRef.current);

    function handleWindowBlur(event: FocusEvent) {
      if (event.target !== win) {
        return;
      }

      windowFocusedRef.current = false;
      pauseTimers();
    }

    function handleWindowFocus(event: FocusEvent) {
      if (event.relatedTarget || event.target === win) {
        return;
      }

      const target = getTarget(event);
      const activeEl = activeElement(ownerDocument(viewportRef.current));
      if (
        !contains(viewportRef.current, target as HTMLElement | null) ||
        !isFocusVisible(activeEl)
      ) {
        resumeTimers();
      }

      // Wait for the `handleFocus` event to fire.
      setTimeout(() => {
        windowFocusedRef.current = true;
      });
    }

    win.addEventListener('blur', handleWindowBlur, true);
    win.addEventListener('focus', handleWindowFocus, true);

    return () => {
      win.removeEventListener('blur', handleWindowBlur, true);
      win.removeEventListener('focus', handleWindowFocus, true);
    };
  }, [
    pauseTimers,
    resumeTimers,
    viewportRef,
    windowFocusedRef,
    setFocused,
    focusedRef,
    // `viewportRef.current` isn't available on the first render,
    // since the portal node hasn't yet been created.
    // By adding this dependency, we ensure the window listeners
    // are added when toasts have been created, once the ref is available.
    numToasts,
  ]);

  function handleFocusGuard(event: React.FocusEvent) {
    if (!viewportRef.current) {
      return;
    }

    handlingFocusGuardRef.current = true;

    // If we're coming off the container, move to the first toast
    if (event.relatedTarget === viewportRef.current) {
      toasts[0]?.ref?.current?.focus();
    } else {
      prevFocusElement?.focus({ preventScroll: true });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab' && event.shiftKey && event.target === viewportRef.current) {
      event.preventDefault();
      prevFocusElement?.focus({ preventScroll: true });
      resumeTimers();
    }
  }

  function handleMouseEnter() {
    pauseTimers();
    setHovering(true);
  }

  function handleMouseLeave() {
    const activeEl = activeElement(ownerDocument(viewportRef.current));
    if (contains(viewportRef.current, activeEl) && isFocusVisible(activeEl)) {
      return;
    }

    resumeTimers();
    setHovering(false);
  }

  function handleFocus() {
    if (handlingFocusGuardRef.current) {
      handlingFocusGuardRef.current = false;
      return;
    }

    if (focused) {
      return;
    }

    // If the window was previously blurred, the focus must be visible to
    // pause the timers, since for pointers it's unexpected that focus is
    // considered inside the viewport at this point.
    const activeEl = activeElement(ownerDocument(viewportRef.current));
    if (!windowFocusedRef.current && !isFocusVisible(activeEl)) {
      return;
    }

    setFocused(true);
    pauseTimers();
  }

  function handleBlur(event: React.FocusEvent) {
    if (!focused || contains(viewportRef.current, event.relatedTarget as HTMLElement | null)) {
      return;
    }

    setFocused(false);
    resumeTimers();
  }

  function getViewportProps(externalProps = {}) {
    return mergeProps(
      {
        role: 'region',
        tabIndex: -1,
        'aria-label': `${numToasts} notification${numToasts !== 1 ? 's' : ''} (F6)`,
        onMouseEnter: handleMouseEnter,
        onMouseMove: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        onClick: handleFocus,
      },
      externalProps,
    );
  }

  const contextValue = React.useMemo(
    () => ({
      viewportRef,
    }),
    [viewportRef],
  );

  return {
    viewportRef,
    numToasts,
    prevFocusElement,
    toasts,
    handleFocusGuard,
    getViewportProps,
    contextValue,
  };
}
