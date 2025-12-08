'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui-components/utils/owner';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useStore } from '@base-ui-components/utils/store';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { FocusGuard } from '../../utils/FocusGuard';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useToastContext } from '../provider/ToastProviderContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { isFocusVisible } from '../utils/focusVisible';
import { ToastViewportCssVars } from './ToastViewportCssVars';
import { selectors } from '../store';

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
  const { render, className, children, ...elementProps } = componentProps;

  const { store, viewportRef } = useToastContext();

  const handlingFocusGuardRef = React.useRef(false);
  const markedReadyForMouseLeaveRef = React.useRef(false);

  const isEmpty = useStore(store, selectors.isEmpty);
  const toasts = useStore(store, selectors.toasts);
  const focused = useStore(store, selectors.focused);
  const expanded = useStore(store, selectors.expanded);
  const prevFocusElement = useStore(store, selectors.prevFocusElement);
  const frontmostHeight = toasts[0]?.height ?? 0;

  const hasTransitioningToasts = React.useMemo(
    () => toasts.some((toast) => toast.transitionStatus === 'ending'),
    [toasts],
  );

  // Listen globally for F6 so we can force-focus the viewport.
  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (isEmpty) {
        return;
      }

      if (event.key === 'F6' && event.target !== viewportRef.current) {
        event.preventDefault();
        store.setPrevFocusElement(
          activeElement(ownerDocument(viewportRef.current)) as HTMLElement | null,
        );
        viewportRef.current?.focus({ preventScroll: true });
        store.pauseTimers();
        store.setFocused(true);
      }
    }

    const win = ownerWindow(viewportRef.current);

    win.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      win.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [store, isEmpty, viewportRef]);

  React.useEffect(() => {
    if (!viewportRef.current || isEmpty) {
      return undefined;
    }

    const win = ownerWindow(viewportRef.current);

    function handleWindowBlur(event: FocusEvent) {
      if (event.target !== win) {
        return;
      }

      store.setIsWindowFocused(false);
      store.pauseTimers();
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
        store.resumeTimers();
      }

      // Wait for the `handleFocus` event to fire.
      setTimeout(() => store.setIsWindowFocused(true));
    }

    win.addEventListener('blur', handleWindowBlur, true);
    win.addEventListener('focus', handleWindowFocus, true);

    return () => {
      win.removeEventListener('blur', handleWindowBlur, true);
      win.removeEventListener('focus', handleWindowFocus, true);
    };
  }, [
    store,
    viewportRef,
    // `viewportRef.current` isn't available on the first render,
    // since the portal node hasn't yet been created.
    // By adding this dependency, we ensure the window listeners
    // are added when toasts have been created, once the ref is available.
    isEmpty,
  ]);

  React.useEffect(() => {
    const viewportNode = viewportRef.current;
    if (!viewportNode || isEmpty) {
      return undefined;
    }

    const doc = ownerDocument(viewportNode);

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== 'touch') {
        return;
      }

      const target = getTarget(event) as Element | null;
      if (contains(viewportNode, target)) {
        return;
      }

      store.resumeTimers();
      store.setHovering(false);
      store.setFocused(false);
    }

    doc.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      doc.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isEmpty, store, viewportRef]);

  function handleFocusGuard(event: React.FocusEvent) {
    if (!viewportRef.current) {
      return;
    }

    handlingFocusGuardRef.current = true;

    // If we're coming off the container, move to the first toast
    if (event.relatedTarget === viewportRef.current) {
      toasts[0]?.ref?.current?.focus();
    } else {
      store.restoreFocusToPrevElement();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab' && event.shiftKey && event.target === viewportRef.current) {
      event.preventDefault();
      store.restoreFocusToPrevElement();
      store.resumeTimers();
    }
  }

  React.useEffect(() => {
    if (
      !store.state.isWindowFocused ||
      hasTransitioningToasts ||
      !markedReadyForMouseLeaveRef.current
    ) {
      return;
    }

    // Once transitions have finished, see if a mouseleave was already triggered
    // but blocked from taking effect. If so, we can now safely resume timers and
    // collapse the viewport.
    store.resumeTimers();
    store.setHovering(false);
    markedReadyForMouseLeaveRef.current = false;
  }, [hasTransitioningToasts, store]);

  function handleMouseEnter() {
    store.pauseTimers();
    store.setHovering(true);
    markedReadyForMouseLeaveRef.current = false;
  }

  function handleMouseLeave() {
    if (hasTransitioningToasts) {
      // When swiping to dismiss, wait until the transitions have settled
      // to avoid the viewport collapsing while the user is interacting.
      markedReadyForMouseLeaveRef.current = true;
    } else {
      store.resumeTimers();
      store.setHovering(false);
    }
  }

  function handleFocus() {
    if (handlingFocusGuardRef.current) {
      handlingFocusGuardRef.current = false;
      return;
    }

    if (focused) {
      return;
    }

    // Only set focused when the active element is focus-visible.
    // This prevents the viewport from staying expanded when clicking inside without
    // keyboard navigation.
    if (isFocusVisible(ownerDocument(viewportRef.current).activeElement)) {
      store.setFocused(true);
      store.pauseTimers();
    }
  }

  function handleBlur(event: React.FocusEvent) {
    if (!focused || contains(viewportRef.current, event.relatedTarget as HTMLElement | null)) {
      return;
    }

    store.setFocused(false);
    store.resumeTimers();
  }

  const defaultProps: HTMLProps = {
    tabIndex: -1,
    role: 'region',
    'aria-live': 'polite',
    'aria-atomic': false,
    'aria-relevant': 'additions text',
    'aria-label': 'Notifications',
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onClick: handleFocus,
  };

  const state: ToastViewport.State = React.useMemo(
    () => ({
      expanded,
    }),
    [expanded],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, viewportRef],
    state,
    props: [
      defaultProps,
      {
        style: {
          [ToastViewportCssVars.frontmostHeight as string]: frontmostHeight
            ? `${frontmostHeight}px`
            : undefined,
        },
      },
      elementProps,
      {
        children: (
          <React.Fragment>
            {!isEmpty && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
            {children}
            {!isEmpty && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
          </React.Fragment>
        ),
      },
    ],
  });

  const highPriorityToasts = React.useMemo(
    () => toasts.filter((toast) => toast.priority === 'high'),
    [toasts],
  );

  return (
    <React.Fragment>
      {!isEmpty && prevFocusElement && <FocusGuard onFocus={handleFocusGuard} />}
      {element}
      {!focused && highPriorityToasts.length > 0 && (
        <div style={visuallyHidden}>
          {highPriorityToasts.map((toast) => (
            <div key={toast.id} role="alert" aria-atomic>
              <div>{toast.title}</div>
              <div>{toast.description}</div>
            </div>
          ))}
        </div>
      )}
    </React.Fragment>
  );
});

export interface ToastViewportState {
  /**
   * Whether toasts are expanded in the viewport.
   */
  expanded: boolean;
}

export interface ToastViewportProps extends BaseUIComponentProps<'div', ToastViewport.State> {}

export namespace ToastViewport {
  export type State = ToastViewportState;
  export type Props = ToastViewportProps;
}
