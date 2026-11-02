'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { activeElement, contains, getTarget } from '@base-ui/utils/shadowDom';
import { FocusGuard } from '../../utils/popups/focus/FocusGuard';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { isFocusVisible } from '../utils/focusVisible';
import * as ToastViewportCssVars from './ToastViewportCssVars';

/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastViewport = React.forwardRef(function ToastViewport(
  componentProps: ToastViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, ...elementProps } = componentProps;

  const store = useToastProviderContext();
  const windowFocusTimeout = useTimeout();

  const markedReadyForMouseLeaveRef = React.useRef(false);
  const touchActiveRef = React.useRef(false);

  const isEmpty = store.useState('isEmpty');
  const toasts = store.useState('toasts');
  const focused = store.useState('focused');
  const expanded = store.useState('expanded');
  const prevFocusElement = store.useState('prevFocusElement');
  const frontmostHeight = toasts[0]?.height;

  const hasTransitioningToasts = toasts.some((toast) => toast.transitionStatus === 'ending');

  React.useEffect(() => {
    // Window focus is tracked even while empty, so toasts added in the background start paused.
    // `isEmpty` only toggles the F6 and touch listeners.
    const viewport = store.state.viewport;
    if (!viewport) {
      return undefined;
    }

    const win = ownerWindow(viewport);
    const doc = ownerDocument(viewport);

    // Listen globally for F6 so we can force-focus the viewport.
    function handleGlobalKeyDown(event: KeyboardEvent) {
      // Skip presses another viewport already handled.
      if (event.key !== 'F6' || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      // Set the restore target before focusing: consumer focus handlers may close the toasts.
      store.set('prevFocusElement', activeElement(doc) as HTMLElement | null);
      // `handleFocus` pauses only on visible focus, which script focus doesn't get everywhere.
      viewport?.focus({ preventScroll: true, focusVisible: true });
    }

    function handleWindowBlur(event: FocusEvent) {
      if (getTarget(event) !== win) {
        return;
      }

      windowFocusTimeout.clear();
      store.set('isWindowFocused', false);
      store.pauseTimers();
    }

    function handleWindowFocus(event: FocusEvent) {
      if (event.relatedTarget) {
        return;
      }

      // This capture listener also sees element focus, e.g. a click on a toast while nothing
      // had focus. Wait for `handleFocus` so keyboard focus inside the viewport keeps the pause,
      // and resume after the flag flips so toasts added in between start running too.
      windowFocusTimeout.start(0, () => {
        store.set('isWindowFocused', true);
        if (!store.select('expanded')) {
          store.resumeTimers();
        }
      });
    }

    return mergeCleanups(
      addEventListener(win, 'blur', handleWindowBlur, true),
      addEventListener(win, 'focus', handleWindowFocus, true),
      !isEmpty && addEventListener(win, 'keydown', handleGlobalKeyDown),
      !isEmpty && addEventListener(doc, 'pointerdown', store.handleDocumentPointerDown, true),
    );
  }, [store, windowFocusTimeout, isEmpty]);

  function handleFocusGuard(event: React.FocusEvent) {
    // If we're coming off the container, move to the first toast that can hold
    // focus, skipping toasts that are animating out or inert because they're limited.
    const firstFocusableToast =
      event.relatedTarget === store.state.viewport
        ? toasts.find((toast) => toast.transitionStatus !== 'ending' && !toast.limited)
        : undefined;

    if (firstFocusableToast) {
      firstFocusableToast.ref?.current?.focus();
    } else {
      store.restoreFocusToPrevElement();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.defaultPrevented) {
      return;
    }

    const isF6 = event.key === 'F6';
    if (isF6) {
      // Keep F6 pressed inside the viewport away from the global F6 listeners (including this
      // one's), which would pull focus back to the viewport. Without a return target, leave the
      // default action to the browser.
      event.stopPropagation();
    }

    if (
      (isF6 ||
        (event.key === 'Tab' &&
          event.shiftKey &&
          getTarget(event.nativeEvent) === store.state.viewport)) &&
      store.state.prevFocusElement &&
      store.restoreFocusToPrevElement()
    ) {
      // Cancel only if focus moved: a hidden or disabled return target leaves the
      // browser free to move focus. `handleBlur` resumes the timers.
      event.preventDefault();
    }
  }

  function flushMouseLeave() {
    const hasEndingToasts = store.state.toasts.some((toast) => toast.transitionStatus === 'ending');

    if (hasEndingToasts || touchActiveRef.current || !markedReadyForMouseLeaveRef.current) {
      return;
    }

    // Apply any mouseleave that was deferred until transitions finished.
    store.set('hovering', false);
    if (!store.select('expandedOrOutOfFocus')) {
      store.resumeTimers();
    }
    markedReadyForMouseLeaveRef.current = false;
  }

  React.useEffect(flushMouseLeave, [hasTransitioningToasts, store]);

  function handleMouseEnter() {
    store.pauseTimers();
    store.set('hovering', true);
    markedReadyForMouseLeaveRef.current = false;
  }

  function handleMouseLeave() {
    // Defer to `flushMouseLeave`: while toasts are transitioning out or a touch gesture is active it
    // records the intent and collapses later; otherwise it collapses immediately.
    markedReadyForMouseLeaveRef.current = true;
    flushMouseLeave();
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (event.pointerType === 'touch') {
      touchActiveRef.current = true;
    }
  }

  function handlePointerEnd(event: React.PointerEvent) {
    if (event.pointerType !== 'touch') {
      return;
    }

    touchActiveRef.current = false;
    flushMouseLeave();
  }

  function handleFocus() {
    if (focused) {
      return;
    }

    // Only set focused when the active element is focus-visible.
    // This prevents the viewport from staying expanded when clicking inside without
    // keyboard navigation.
    const activeEl = activeElement(ownerDocument(store.state.viewport));
    if (contains(store.state.viewport, activeEl) && isFocusVisible(activeEl)) {
      store.set('focused', true);
      store.pauseTimers();
    }
  }

  function handleBlur(event: React.FocusEvent) {
    if (!focused || contains(store.state.viewport, event.relatedTarget as HTMLElement | null)) {
      return;
    }

    store.set('focused', false);
    if (!store.select('expandedOrOutOfFocus')) {
      store.resumeTimers();
    }
  }

  const defaultProps: HTMLProps = {
    tabIndex: -1,
    role: 'region',
    'aria-label': 'Notifications',
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onClick: handleFocus,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    style: {
      [ToastViewportCssVars.frontmostHeight as string]: frontmostHeight
        ? `${frontmostHeight}px`
        : undefined,
    },
  };

  const state: ToastViewportState = {
    expanded,
  };

  const focusGuard = !isEmpty && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />;

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.setViewport],
    state,
    props: [
      defaultProps,
      elementProps,
      {
        children: (
          <React.Fragment>
            {focusGuard}
            {children}
            {focusGuard}
          </React.Fragment>
        ),
      },
    ],
  });

  return (
    <React.Fragment>
      {focusGuard}
      {element}
    </React.Fragment>
  );
});

export interface ToastViewportState {
  /**
   * Whether toasts are expanded in the viewport.
   */
  expanded: boolean;
}

export interface ToastViewportProps extends BaseUIComponentProps<'div', ToastViewportState> {}

export namespace ToastViewport {
  export type State = ToastViewportState;
  export type Props = ToastViewportProps;
}
