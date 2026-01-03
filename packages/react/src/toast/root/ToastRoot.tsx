'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { activeElement, contains } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { ToastRootContext } from './ToastRootContext';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useToastContext } from '../provider/ToastProviderContext';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { ToastRootCssVars } from './ToastRootCssVars';
import { useSwipeDismiss } from '../../utils/useSwipeDismiss';

const stateAttributesMapping: StateAttributesMapping<ToastRoot.State> = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    return value ? { 'data-swipe-direction': value } : null;
  },
};

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastRoot = React.forwardRef(function ToastRoot(
  componentProps: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    toast,
    render,
    className,
    swipeDirection = ['down', 'right'],
    ...elementProps
  } = componentProps;

  const isAnchored = toast.positionerProps?.anchor !== undefined;

  let swipeDirections: ('up' | 'down' | 'left' | 'right')[] = [];
  if (!isAnchored) {
    swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
  }

  const swipeEnabled = swipeDirections.length > 0;

  const { toasts, focused, close, remove, setToasts, pauseTimers, expanded, setHovering } =
    useToastContext();

  const [titleId, setTitleId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>();

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const visibleIndex = React.useMemo(
    () => toasts.filter((t) => t.transitionStatus !== 'ending').indexOf(toast),
    [toast, toasts],
  );
  const offsetY = React.useMemo(() => {
    return toasts.slice(0, toasts.indexOf(toast)).reduce((acc, t) => acc + (t.height || 0), 0);
  }, [toasts, toast]);

  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        remove(toast.id);
      }
    },
  });

  /**
   * Recalculates the natural height of the toast and updates it in the toast manager.
   * @param flushSync Whether to flush the update synchronously. Use in observer
   * callbacks to avoid visual flickers.
   */
  const recalculateHeight = useStableCallback((flushSync: boolean = false) => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const previousHeight = element.style.height;
    element.style.height = 'auto';
    const height = element.offsetHeight;
    element.style.height = previousHeight;

    function update() {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === toast.id
            ? {
                ...t,
                ref: rootRef,
                height,
                transitionStatus: undefined,
              }
            : t,
        ),
      );
    }

    if (flushSync) {
      ReactDOM.flushSync(update);
    } else {
      update();
    }
  });

  useIsoLayoutEffect(recalculateHeight, [recalculateHeight]);

  const handleSwipeStart = useStableCallback(() => {
    setHovering(true);
  });

  const handleTouchSwipeStart = useStableCallback(() => {
    pauseTimers();
  });

  const handleSwipeDismiss = useStableCallback(() => {
    close(toast.id);
  });

  const swipe = useSwipeDismiss({
    enabled: swipeEnabled,
    directions: swipeDirections,
    elementRef: rootRef,
    movementCssVars: {
      x: ToastRootCssVars.swipeMovementX,
      y: ToastRootCssVars.swipeMovementY,
    },
    onSwipeStart: handleSwipeStart,
    onTouchSwipeStart: handleTouchSwipeStart,
    onDismiss: handleSwipeDismiss,
  });

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      if (
        !rootRef.current ||
        !contains(rootRef.current, activeElement(ownerDocument(rootRef.current)))
      ) {
        return;
      }
      close(toast.id);
    }
  }

  const swipePointerProps = swipe.getPointerProps();

  const isHighPriority = toast.priority === 'high';

  const defaultProps: HTMLProps = {
    role: isHighPriority ? 'alertdialog' : 'dialog',
    tabIndex: 0,
    'aria-modal': false,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'aria-hidden': isHighPriority && !focused ? true : undefined,
    onPointerDown: swipePointerProps.onPointerDown,
    onPointerMove: swipePointerProps.onPointerMove,
    onPointerUp: swipePointerProps.onPointerUp,
    onKeyDown: handleKeyDown,
    inert: inertValue(toast.limited),
    style: {
      ...swipe.getDragStyles(),
      [ToastRootCssVars.index as string]:
        toast.transitionStatus === 'ending' ? domIndex : visibleIndex,
      [ToastRootCssVars.offsetY as string]: `${offsetY}px`,
      [ToastRootCssVars.height as string]: toast.height ? `${toast.height}px` : undefined,
    },
  };

  const toastRoot: ToastRootContext = React.useMemo(
    () => ({
      rootRef,
      toast,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      swiping: swipe.swiping,
      swipeDirection: swipe.swipeDirection,
      recalculateHeight,
      index: domIndex,
      visibleIndex,
      expanded,
    }),
    [
      toast,
      titleId,
      descriptionId,
      swipe.swiping,
      swipe.swipeDirection,
      recalculateHeight,
      domIndex,
      visibleIndex,
      expanded,
    ],
  );

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.transitionStatus,
      expanded,
      limited: toast.limited || false,
      type: toast.type,
      swiping: toastRoot.swiping,
      swipeDirection: toastRoot.swipeDirection,
    }),
    [
      expanded,
      toast.transitionStatus,
      toast.limited,
      toast.type,
      toastRoot.swiping,
      toastRoot.swipeDirection,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, toastRoot.rootRef],
    state,
    stateAttributesMapping,
    props: [defaultProps, elementProps],
  });

  return <ToastRootContext.Provider value={toastRoot}>{element}</ToastRootContext.Provider>;
});

export type ToastRootToastObject<Data extends object = any> = ToastObjectType<Data>;
export interface ToastRootState {
  transitionStatus: TransitionStatus;
  /** Whether the toasts in the viewport are expanded. */
  expanded: boolean;
  /** Whether the toast was removed due to exceeding the limit. */
  limited: boolean;
  /** The type of the toast. */
  type: string | undefined;
  /** Whether the toast is being swiped. */
  swiping: boolean;
  /** The direction the toast is being swiped. */
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
}
export interface ToastRootProps extends BaseUIComponentProps<'div', ToastRoot.State> {
  /**
   * The toast to render.
   */
  toast: ToastRootToastObject<any>;
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default ['down', 'right']
   */
  swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[];
}

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastRootToastObject<Data>;
  export type State = ToastRootState;
  export type Props = ToastRootProps;
}
