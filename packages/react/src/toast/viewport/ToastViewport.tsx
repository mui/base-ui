'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { ownerDocument } from '../../utils/owner';
import { ToastViewportContext } from './ToastViewportContext';

const state = {};
/**
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastViewport = React.forwardRef(function ToastViewport(
  props: ToastViewport.Props,
  forwardedRef: React.Ref<HTMLDivElement>,
) {
  const { render, className, ...other } = props;

  const { pauseTimers, resumeTimers, toasts, prevFocusRef, setHovering, setFocused } =
    useToastContext();

  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  const mergedRef = useForkRef(viewportRef, forwardedRef);

  // Listen globally for alt+T (or F6) so we can force-focus the viewport.
  React.useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (toasts.length === 0) {
        return;
      }

      if ((event.altKey && event.code === 'KeyT') || event.key === 'F6') {
        event.preventDefault();
        prevFocusRef.current = activeElement(
          ownerDocument(viewportRef.current),
        ) as HTMLElement | null;
        viewportRef.current?.focus();
        pauseTimers();
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pauseTimers, prevFocusRef, toasts.length]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Tab') {
      const container = viewportRef.current;
      if (!container) {
        return;
      }

      const toastElements = Array.from<HTMLElement>(container.querySelectorAll('[tabindex="0"]'));

      // If tabbing forward, the first toast is focused
      if (!event.shiftKey && event.target === container) {
        event.preventDefault();
        toastElements[0]?.focus();
      }

      // If tabbing backward (Shift+Tab) and on the first toast, return focus to the previous element
      if (event.shiftKey && toastElements.length > 0 && event.target === toastElements[0]) {
        event.preventDefault();
        if (prevFocusRef.current) {
          prevFocusRef.current.focus();
          prevFocusRef.current = null;
        }
        resumeTimers();
      }
    }
  }

  function handleMouseEnter() {
    pauseTimers();
    setHovering(true);
  }

  function handleMouseLeave() {
    resumeTimers();
    setHovering(false);
  }

  function handleFocus() {
    setFocused(true);
    pauseTimers();
  }

  function handleBlur(event: React.FocusEvent) {
    if (!contains(viewportRef.current, event.relatedTarget as HTMLElement | null)) {
      setFocused(false);
      resumeTimers();
    }
  }

  const numToasts = toasts.length;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: mergeReactProps<'div'>(other, {
      role: 'region',
      tabIndex: -1,
      'aria-label': `${numToasts} notification${numToasts !== 1 ? 's' : ''}`,
      onKeyDown: handleKeyDown,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    }),
  });

  const contextValue = React.useMemo(() => ({ viewportRef }), [viewportRef]);

  return (
    <ToastViewportContext.Provider value={contextValue}>
      {renderElement()}
    </ToastViewportContext.Provider>
  );
});

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

namespace ToastViewport {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { ToastViewport };
