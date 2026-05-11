'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { activeElement, contains, getTarget } from '../../internals/shadowDom';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { ToastRootContext } from './ToastRootContext';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { ToastRootCssVars } from './ToastRootCssVars';
import {
  BASE_UI_SWIPE_IGNORE_SELECTOR,
  LEGACY_SWIPE_IGNORE_SELECTOR,
} from '../../internals/constants';
import { useSwipeDismiss, type SwipeDirection } from '../../utils/useSwipeDismiss';

const stateAttributesMapping: StateAttributesMapping<ToastRootState> = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    return value ? { 'data-swipe-direction': value } : null;
  },
};

const TOAST_SWIPE_IGNORE_SELECTOR = `${BASE_UI_SWIPE_IGNORE_SELECTOR},${LEGACY_SWIPE_IGNORE_SELECTOR}`;

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
    style,
    ...elementProps
  } = componentProps;

  const isAnchored = toast.positionerProps?.anchor !== undefined;

  let swipeDirections: SwipeDirection[] = [];
  if (!isAnchored) {
    swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
  }

  const swipeEnabled = swipeDirections.length > 0;

  const store = useToastProviderContext();

  const [titleId, setTitleId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>();

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const domIndex = store.useState('toastIndex', toast.id);
  const visibleIndex = store.useState('toastVisibleIndex', toast.id);
  const offsetY = store.useState('toastOffsetY', toast.id);
  const focused = store.useState('focused');
  const expanded = store.useState('expanded');

  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        store.removeToast(toast.id);
      }
    },
  });

  // Recalculates the natural height of the toast and updates it in the toast manager.
  // `flushSync` avoids visual flickers when called from observer callbacks.
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
      store.updateToastInternal(toast.id, {
        ref: rootRef,
        height,
        ...(toast.transitionStatus === 'starting' ? { transitionStatus: undefined } : {}),
      });
    }

    if (flushSync) {
      ReactDOM.flushSync(update);
    } else {
      update();
    }
  });

  useIsoLayoutEffect(recalculateHeight, [recalculateHeight]);

  const swipe = useSwipeDismiss({
    enabled: swipeEnabled,
    directions: swipeDirections,
    elementRef: rootRef,
    movementCssVars: {
      x: ToastRootCssVars.swipeMovementX,
      y: ToastRootCssVars.swipeMovementY,
    },
    ignoreSelector: `button,a,input,textarea,[role="button"],${TOAST_SWIPE_IGNORE_SELECTOR}`,
    onSwipeStart() {
      store.setHovering(true);
    },
    onDismiss() {
      store.closeToast(toast.id);
    },
  });

  const swipePointerProps = swipe.getPointerProps();

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      if (
        !rootRef.current ||
        !contains(rootRef.current, activeElement(ownerDocument(rootRef.current)))
      ) {
        return;
      }
      store.closeToast(toast.id);
    }
  }

  React.useEffect(() => {
    if (!swipeEnabled) {
      return undefined;
    }

    const element = rootRef.current;
    if (!element) {
      return undefined;
    }

    function preventDefaultTouchStart(event: TouchEvent) {
      if (contains(element, getTarget(event) as HTMLElement | null)) {
        event.preventDefault();
      }
    }

    return addEventListener(element, 'touchmove', preventDefaultTouchStart, { passive: false });
  }, [swipeEnabled]);

  const isHighPriority = toast.priority === 'high';

  const defaultProps: HTMLProps = {
    role: isHighPriority ? 'alertdialog' : 'dialog',
    tabIndex: 0,
    'aria-modal': false,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'aria-hidden': isHighPriority && !focused ? true : undefined,
    onPointerDown: swipeEnabled
      ? (event) => {
          if (event.pointerType === 'touch') {
            store.pauseTimers();
          }
          swipePointerProps.onPointerDown?.(event);
        }
      : undefined,
    onPointerMove: swipePointerProps.onPointerMove,
    onPointerUp: swipePointerProps.onPointerUp,
    onPointerCancel: swipePointerProps.onPointerCancel,
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

  const state: ToastRootState = {
    transitionStatus: toast.transitionStatus,
    expanded,
    limited: toast.limited || false,
    type: toast.type,
    swiping: toastRoot.swiping,
    swipeDirection: toastRoot.swipeDirection,
  };

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
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the toasts in the viewport are expanded.
   */
  expanded: boolean;
  /**
   * Whether the toast was limited because the toast limit was exceeded.
   */
  limited: boolean;
  /**
   * The type of the toast.
   */
  type: string | undefined;
  /**
   * Whether the toast is being swiped.
   */
  swiping: boolean;
  /**
   * The direction the toast is being swiped.
   */
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
}
export interface ToastRootProps extends BaseUIComponentProps<'div', ToastRootState> {
  /**
   * The toast to render.
   */
  toast: ToastRootToastObject<any>;
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default ['down', 'right']
   */
  swipeDirection?:
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | ('up' | 'down' | 'left' | 'right')[]
    | undefined;
}

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastRootToastObject<Data>;
  export type State = ToastRootState;
  export type Props = ToastRootProps;
}
