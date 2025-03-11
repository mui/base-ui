'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useForkRef } from '../../utils/useForkRef';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { ToastViewportContext } from './ToastViewportContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import { FocusGuard } from './FocusGuard';
import { isFocusVisible } from '../utils/focusVisible';
import { useLatestRef } from '../../utils/useLatestRef';

const state = {};

/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastViewport = React.forwardRef(function ToastViewport(
  props: ToastViewport.Props,
  forwardedRef: React.Ref<HTMLDivElement>,
) {
  const { render, className, children, ...other } = props;

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

  const mergedRef = useForkRef(viewportRef, forwardedRef);

  // Listen globally for F6 so we can force-focus the viewport.
  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (toasts.length === 0) {
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
  }, [pauseTimers, setFocused, setPrevFocusElement, toasts.length, viewportRef]);

  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    const win = ownerWindow(viewportRef.current);

    function handleWindowBlur(event: FocusEvent) {
      if (event.relatedTarget) {
        return;
      }

      windowFocusedRef.current = false;
      pauseTimers();
    }

    function handleWindowFocus(event: FocusEvent) {
      if (event.relatedTarget || event.target === win) {
        return;
      }

      windowFocusedRef.current = true;

      if (!contains(viewportRef.current, event.target as HTMLElement | null)) {
        resumeTimers();
      }
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
    toasts.length,
  ]);

  function handleFocusGuard(event: React.FocusEvent) {
    if (!viewportRef.current) {
      return;
    }

    handlingFocusGuardRef.current = true;

    // If we're coming off the container, move to the first toast
    if (event.relatedTarget === viewportRef.current) {
      const toastElements = Array.from<HTMLElement>(
        viewportRef.current.querySelectorAll(`[data-base-ui-toast]`),
      );
      toastElements[0]?.focus();
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

  const numToasts = toasts.length;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: mergeProps(
      {
        role: 'region',
        tabIndex: -1,
        'aria-label': `${numToasts} notification${numToasts !== 1 ? 's' : ''} (F6)`,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        children: (
          <React.Fragment>
            {numToasts > 0 && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
            {children}
            {numToasts > 0 && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
          </React.Fragment>
        ),
      },
      other,
    ),
  });

  const contextValue: ToastViewportContext = React.useMemo(() => ({ viewportRef }), [viewportRef]);

  return (
    <ToastViewportContext.Provider value={contextValue}>
      <FloatingPortalLite>
        {numToasts > 0 && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
        {renderElement()}
      </FloatingPortalLite>
    </ToastViewportContext.Provider>
  );
});

namespace ToastViewport {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

ToastViewport.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ToastViewport };
