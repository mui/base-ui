'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerWindow } from '../../utils/owner';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';

let cachedSupportsComputedStyleMap: boolean | undefined;

function supportsComputedStyleMap(element: HTMLElement) {
  if (cachedSupportsComputedStyleMap === undefined) {
    cachedSupportsComputedStyleMap = 'computedStyleMap' in element;
  }
  return cachedSupportsComputedStyleMap;
}

function getAnimationNameFromComputedStyles(element: HTMLElement) {
  if (supportsComputedStyleMap(element)) {
    const styleMap = element.computedStyleMap();
    const animationName = styleMap.get('animation-name');
    return (animationName as CSSKeywordValue)?.value ?? undefined;
  }

  const containerWindow = ownerWindow(element);
  const computedStyles = containerWindow.getComputedStyle(element);
  return computedStyles.animationName;
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

  const latestAnimationNameRef = React.useRef<string>('none');
  const originalTransitionDurationStyleRef = React.useRef<string | null>(null);

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

    latestAnimationNameRef.current = computedAnimationName ?? 'none';
    originalTransitionDurationStyleRef.current = element.style.transitionDuration;
  });

  const mergedRef = useForkRef(ref, handlePanelRef);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef);

  const isOpen = animated ? open || contextMounted : open;

  const isInitialOpenRef = React.useRef(isOpen);

  const isBeforeMatchRef = React.useRef(false);

  useEnhancedEffect(() => {
    const { current: element } = panelRef;

    let frame1 = -1;
    let frame2 = -1;

    if (element) {
      const isBeforeMatch = isBeforeMatchRef.current;
      const isInitiallyOpen = isInitialOpenRef.current;
      const isTransitioning = isTransitioningRef.current;
      const originalAnimationName =
        element.style.animationName === 'none' ? '' : element.style.animationName;
      const originalTransitionDuration = originalTransitionDurationStyleRef.current;
      // cancel animation/transitions for these specific instances:
      // 1. when initially open, on mount/load, it should just appear fully open but remain animated per styles afterwards
      // 2. when using `hidden='until-found'` and is opened by find-in-page, it should open instantly but remain animated //    as styled afterwards
      const shouldCancelAnimation = isBeforeMatch || isInitiallyOpen;

      element.style.animationName = 'none';

      const isClosed = !open && !contextMounted;

      if (!isTransitioning || isClosed) {
        const rect = isClosed ? { height: 0, width: 0 } : element.getBoundingClientRect();
        setDimensions({
          height: rect.height,
          width: rect.width,
        });
      }

      element.style.animationName = shouldCancelAnimation ? 'none' : originalAnimationName;
      element.style.transitionDuration = shouldCancelAnimation
        ? '0s'
        : (originalTransitionDuration ?? '');

      runOnceAnimationsFinish(() => {
        ReactDOM.flushSync(() => {
          setContextMounted(open);
          if (isBeforeMatch) {
            isBeforeMatchRef.current = false;
            frame1 = requestAnimationFrame(() => {
              frame2 = requestAnimationFrame(() => {
                element.style.transitionDuration = originalTransitionDurationStyleRef.current ?? '';
              });
            });
          }
        });
      });
    }

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [open, contextMounted, runOnceAnimationsFinish, setContextMounted]);

  React.useEffect(() => {
    const { current: element } = panelRef;

    let frame2 = -1;
    let frame3 = -1;

    const frame = requestAnimationFrame(() => {
      isInitialOpenRef.current = false;

      if (element) {
        frame2 = requestAnimationFrame(() => {
          frame3 = requestAnimationFrame(() => {
            // it takes 3 frames to unset `'0s'` from the initial open state correctly
            element.style.transitionDuration = originalTransitionDurationStyleRef.current ?? '';
          });
        });
      }
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
    }),
    [getRootProps, height, width],
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
     * If `true`, sets `hidden="until-found"` when closed.
     * If `false`, sets `hidden` when closed.
     * @default false
     */
    hiddenUntilFound?: boolean;
    id?: React.HTMLAttributes<Element>['id'];
    mounted: boolean;
    /**
     * The open state of the Collapsible
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
  }
}
