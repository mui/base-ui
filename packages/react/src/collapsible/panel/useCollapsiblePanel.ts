'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { hasComputedStyleMapSupport } from '../../utils/hasComputedStyleMapSupport';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerWindow } from '../../utils/owner';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';

function getAnimationNameFromComputedStyles(element: HTMLElement) {
  if (hasComputedStyleMapSupport()) {
    const styleMap = element.computedStyleMap();
    const animationName = styleMap.get('animation-name');
    // console.log('animationName', animationName);
    return (animationName as CSSKeywordValue)?.value ?? undefined;
  }

  const containerWindow = ownerWindow(element);
  const computedStyles = containerWindow.getComputedStyle(element);
  return computedStyles.animationName;
}

function getTransitionDurationFromComputedStyles(element: HTMLElement) {
  if (hasComputedStyleMapSupport()) {
    const styleMap = element.computedStyleMap();
    const transitionDuration = styleMap.get('transition-duration') as CSSUnitValue;
    // console.log('transitionDuration', transitionDuration);
    return transitionDuration?.value && transitionDuration?.unit
      ? `${transitionDuration.value}${transitionDuration.unit}`
      : '0s';
  }

  const containerWindow = ownerWindow(element);
  const computedStyles = containerWindow.getComputedStyle(element);
  return computedStyles.transitionDuration;
}

let cachedSupportsHiddenUntilFound: boolean | undefined;

function supportsHiddenUntilFound(element: HTMLElement) {
  // detect support for onbeforematch event and content-visibility
  if (cachedSupportsHiddenUntilFound === undefined) {
    const supportsCssContentVisibility =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('content-visibility', 'hidden');
    const supportsOnBeforeMatch = 'onbeforematch' in ownerWindow(element);
    cachedSupportsHiddenUntilFound =
      process.env.NODE_ENV === 'test'
        ? supportsOnBeforeMatch
        : supportsCssContentVisibility && supportsOnBeforeMatch;
  }
  return cachedSupportsHiddenUntilFound;
}

interface Dimensions {
  height: number;
  width: number;
}

export function useCollapsiblePanel(
  parameters: useCollapsiblePanel.Parameters,
): useCollapsiblePanel.ReturnValue {
  const {
    animated = false,
    hiddenUntilFound = false,
    id: idParam,
    open,
    mounted: contextMounted,
    ref,
    setPanelId,
    setMounted: setContextMounted,
    setOpen,
  } = parameters;

  const id = useId(idParam);

  const panelRef = React.useRef<HTMLElement | null>(null);

  const [{ height, width }, setDimensions] = React.useState<Dimensions>({
    height: 0,
    width: 0,
  });

  const originalAnimationNameRef = React.useRef<string | null>(null);
  const latestAnimationNameRef = React.useRef<string>('none');
  const originalTransitionDurationRef = React.useRef<string>('0s');

  const isTransitioningRef = React.useRef(false);

  useEnhancedEffect(() => {
    setPanelId(id);
    return () => {
      setPanelId(undefined);
    };
  }, [id, setPanelId]);

  const handlePanelRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }

    panelRef.current = element;

    const computedAnimationName = getAnimationNameFromComputedStyles(element);

    originalAnimationNameRef.current =
      computedAnimationName === 'none' ? null : computedAnimationName;
    latestAnimationNameRef.current = computedAnimationName ?? 'none';
    // console.log('computed transitionDuration', getTransitionDurationFromComputedStyles(element));
    // console.log('element.style.transitionDuration', element.style.transitionDuration);
    originalTransitionDurationRef.current = getTransitionDurationFromComputedStyles(element);
  });

  const mergedRef = useForkRef(ref, handlePanelRef);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef);

  const isOpen = animated ? open || contextMounted : open;

  const isInitialOpenRef = React.useRef(isOpen);

  const isBeforeMatchRef = React.useRef(false);

  // handle animations
  useEnhancedEffect(() => {
    if (originalTransitionDurationRef.current !== '0s') {
      return undefined;
    }

    // const latestAnimationName = latestAnimationNameRef.current;

    const { current: element } = panelRef;

    if (!element) {
      return undefined;
    }

    const isBeforeMatch = isBeforeMatchRef.current;
    const isInitiallyOpen = isInitialOpenRef.current;

    const originalAnimationName2 =
      element.style.animationName === 'none' ? '' : element.style.animationName;

    const shouldCancelAnimation = isBeforeMatch || isInitiallyOpen;
    // console.log('shouldCancelAnimation', shouldCancelAnimation);

    // const latestAnimationName2 = getAnimationNameFromComputedStyles(element);
    // console.log('latestAnimationName2', latestAnimationName2);

    element.style.animationName = 'none';

    const isClosed = !open && !contextMounted;

    const rect = isClosed ? { height: 0, width: 0 } : element.getBoundingClientRect();

    console.log(
      'rect.height/width',
      rect.height,
      rect.width,
      'isClosed',
      isClosed,
      'open',
      open,
      'contextMounted',
      contextMounted,
    );

    setDimensions({
      height: rect.height,
      width: rect.width,
    });

    element.style.animationName = shouldCancelAnimation ? 'none' : originalAnimationName2;

    runOnceAnimationsFinish(() => {
      ReactDOM.flushSync(() => {
        setContextMounted(open);
        if (isBeforeMatch) {
          isBeforeMatchRef.current = false;
        }
      });
    });

    return undefined;
  }, [open, contextMounted, runOnceAnimationsFinish, setContextMounted]);

  // handle transitions
  useEnhancedEffect(() => {
    const originalTransitionDuration = originalTransitionDurationRef.current;
    if (originalTransitionDuration === '0s') {
      return undefined;
    }

    const { current: element } = panelRef;

    if (!element) {
      return undefined;
    }

    let frame1 = -1;
    let frame2 = -1;

    const isBeforeMatch = isBeforeMatchRef.current;
    const isInitiallyOpen = isInitialOpenRef.current;
    const isTransitioning = isTransitioningRef.current;
    // const originalAnimationName =
    //   element.style.animationName === 'none' ? '' : element.style.animationName;
    // cancel animation/transitions for these specific instances:
    // 1. when initially open, on mount/load, it should just appear fully open but remain animated per styles afterwards
    // 2. when using `hidden='until-found'` and is opened by find-in-page, it should open instantly but remain animated //    as styled afterwards
    const shouldCancelAnimation = isBeforeMatch || isInitiallyOpen;

    // element.style.animationName = 'none';

    // const isClosed = !open && !contextMounted;

    if (!isTransitioning) {
      if (!contextMounted) {
        // initially closed
        const rect = !open ? { height: 0, width: 0 } : element.getBoundingClientRect();

        console.log(
          '2A',
          'rect.height/width',
          rect.height,
          rect.width,
          'transitioning',
          isTransitioning,
          'open',
          open,
          'contextMounted',
          contextMounted,
        );

        setDimensions({
          height: rect.height,
          width: rect.width,
        });
      } else if (/* contextMounted && open */ isInitiallyOpen) {
        // initially open
        const rect = element.getBoundingClientRect();
        console.log(
          '2B',
          'rect.height/width',
          rect.height,
          rect.width,
          'transitioning',
          isTransitioning,
          'open',
          open,
          'contextMounted',
          contextMounted,
        );
        setDimensions({
          height: rect.height,
          width: rect.width,
        });
      }
    } else if (!open && !contextMounted) {
      setDimensions({
        height: 0,
        width: 0,
      });
    }

    // element.style.animationName = shouldCancelAnimation ? 'none' : originalAnimationName;
    element.style.transitionDuration = shouldCancelAnimation
      ? '0s'
      : (originalTransitionDuration ?? '');

    runOnceAnimationsFinish(() => {
      ReactDOM.flushSync(() => {
        setContextMounted(open);
        if (isBeforeMatch) {
          isBeforeMatchRef.current = false;
        }
        frame1 = requestAnimationFrame(() => {
          frame2 = requestAnimationFrame(() => {
            // console.log(
            //   'originalTransitionDurationRef.current',
            //   originalTransitionDurationRef.current,
            // );
            element.style.transitionDuration =
              originalTransitionDurationRef.current === '0s'
                ? ''
                : originalTransitionDurationRef.current;
          });
        });
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [open, contextMounted, runOnceAnimationsFinish, setContextMounted]);

  React.useEffect(() => {
    const { current: element } = panelRef;
    if (!element) {
      return undefined;
    }

    let frame2 = -1;
    let frame3 = -1;

    const frame = requestAnimationFrame(() => {
      isInitialOpenRef.current = false;

      const originalTransitionDuration = originalTransitionDurationRef.current;
      if (originalTransitionDuration === '0s') {
        return undefined;
      }

      frame2 = requestAnimationFrame(() => {
        frame3 = requestAnimationFrame(() => {
          // it takes 3 frames to unset `'0s'` from the initial open state correctly
          element.style.transitionDuration =
            originalTransitionDurationRef.current === '0s'
              ? ''
              : originalTransitionDurationRef.current;
        });
      });
      return undefined;
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(frame2);
      cancelAnimationFrame(frame3);
    };
  }, []);

  React.useEffect(function registerCssTransitionListeners() {
    const { current: element } = panelRef;
    if (!element) {
      return undefined;
    }

    function handleTransitionRun() {
      isTransitioningRef.current = true;
    }

    function handleTransitionEnd() {
      isTransitioningRef.current = false;
    }

    function handleTransitionCancel() {
      isTransitioningRef.current = false;
    }

    element.addEventListener('transitioncancel', handleTransitionCancel);
    element.addEventListener('transitionend', handleTransitionEnd);
    element.addEventListener('transitionrun', handleTransitionRun);

    return () => {
      element.removeEventListener('transitioncancel', handleTransitionCancel);
      element.removeEventListener('transitionend', handleTransitionEnd);
      element.removeEventListener('transitionrun', handleTransitionRun);
    };
  }, []);

  // if `hidden="until-found"` content is revealed by browser's in-page search
  // we need to manually sync the open state
  React.useEffect(
    function registerBeforeMatchListener() {
      const { current: element } = panelRef;

      if (!element || !supportsHiddenUntilFound(element)) {
        return undefined;
      }

      function handleOnBeforeMatch(event: Event) {
        event.preventDefault();

        isBeforeMatchRef.current = true;

        // beforematch only fires if the matching content is initially hidden
        setOpen(true);
      }

      element.addEventListener('beforematch', handleOnBeforeMatch);

      return () => {
        element.removeEventListener('beforematch', handleOnBeforeMatch);
      };
    },
    [setOpen],
  );

  // There is a bug in react that forces string values for the `hidden` attribute to a boolean
  // so we have to force it back to `'until-found'` in the DOM when applicable
  // https://github.com/facebook/react/issues/24740
  useEnhancedEffect(() => {
    const { current: element } = panelRef;

    if (
      element &&
      supportsHiddenUntilFound(element) &&
      element?.hidden &&
      !isOpen &&
      hiddenUntilFound === true
    ) {
      // @ts-ignore
      element.hidden = 'until-found';
    }
  }, [hiddenUntilFound, isOpen]);

  const hidden = hiddenUntilFound ? 'until-found' : 'hidden';

  const getRootProps: useCollapsiblePanel.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
        hidden: isOpen ? undefined : hidden,
        ref: mergedRef,
      }),
    [hidden, id, isOpen, mergedRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      height,
      width,
      isOpen,
    }),
    [getRootProps, height, width, isOpen],
  );
}

export namespace useCollapsiblePanel {
  export interface Parameters {
    /**
     * If `true`, the component supports CSS/JS-based animations and transitions.
     * @default false
     */
    animated?: boolean;
    /**
     * If `true`, sets the hidden state using `hidden="until-found"`. The panel
     * remains mounted in the DOM when closed and overrides `keepMounted`.
     * If `false`, sets the hidden state using `hidden`.
     * @default false
     */
    hiddenUntilFound?: boolean;
    id?: React.HTMLAttributes<Element>['id'];
    mounted: boolean;
    /**
     * The open state of the Collapsible.
     */
    open: boolean;
    ref: React.Ref<HTMLElement>;
    setPanelId: (id: string | undefined) => void;
    setOpen: (nextOpen: boolean) => void;
    setMounted: (nextMounted: boolean) => void;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
    height: number;
    width: number;
    /**
     * The open state of the panel, that accounts for animation/transition status.
     */
    isOpen: boolean;
  }
}
