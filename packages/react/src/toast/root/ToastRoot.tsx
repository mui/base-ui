'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useToastContext, type Toast } from '../provider/ToastProviderContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ToastRootContext } from './ToastRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ToastRootCssVars } from './ToastRootCssVars';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastRoot = React.forwardRef(function ToastRoot(
  props: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { toast, render, className, ...other } = props;

  const { toasts, finalizeRemove, hovering, focused, setToasts } = useToastContext();

  const handleTransitionEnd = useEventCallback((event: React.TransitionEvent) => {
    if (event.target === event.currentTarget && toast.animation === 'ending') {
      finalizeRemove(toast.id);
    }
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = useForkRef(rootRef, forwardedRef);

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const index = React.useMemo(
    () => toasts.filter((t) => t.animation !== 'ending').indexOf(toast),
    [toast, toasts],
  );

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.animation,
      expanded: hovering || focused,
    }),
    [toast.animation, hovering, focused],
  );

  useEnhancedEffect(() => {
    if (!rootRef.current) {
      return undefined;
    }

    function setHeights() {
      const height = rootRef.current?.offsetHeight;
      setToasts((prev) =>
        prev.map((t) =>
          t.id === toast.id
            ? {
                ...t,
                height,
                animation: undefined,
              }
            : t,
        ),
      );
    }

    setHeights();
    const resizeObserver = new ResizeObserver(setHeights);

    resizeObserver.observe(rootRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [toast.id, setToasts]);

  // Calculate offset based on heights of previous toasts
  const offset = React.useMemo(() => {
    const i = toasts.findIndex((t) => t.id === toast.id);
    return toasts.slice(0, i).reduce((acc, t) => acc + (t.height ?? 0), 0);
  }, [toasts, toast.id]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping: transitionStatusMapping,
    extraProps: mergeReactProps<'div'>(other, {
      role: toast.priority === 'high' ? 'alertdialog' : 'dialog',
      'aria-modal': false,
      tabIndex: 0,
      ['data-base-ui-toast' as string]: '',
      onTransitionEnd: handleTransitionEnd,
      style: {
        [ToastRootCssVars.index as string]: toast.animation === 'ending' ? domIndex : index,
        [ToastRootCssVars.offset as string]: `${offset}px`,
      },
    }),
  });

  const contextValue = React.useMemo(() => ({ toast, rootRef }), [toast]);

  return (
    <ToastRootContext.Provider value={contextValue}>{renderElement()}</ToastRootContext.Provider>
  );
});

ToastRoot.propTypes /* remove-proptypes */ = {
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
  /**
   * @ignore
   */
  toast: PropTypes.shape({
    animation: PropTypes.oneOf(['ending', 'starting']),
    description: PropTypes.string,
    duration: PropTypes.number,
    height: PropTypes.number,
    id: PropTypes.string.isRequired,
    priority: PropTypes.oneOf(['high', 'low']),
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['error', 'loading', 'message', 'success']).isRequired,
  }).isRequired,
} as any;

namespace ToastRoot {
  export interface State {
    transitionStatus: TransitionStatus;
    expanded: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    toast: Toast;
  }
}

export { ToastRoot };
