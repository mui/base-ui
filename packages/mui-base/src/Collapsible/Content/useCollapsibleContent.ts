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

function getComputedStyles(element: HTMLElement) {
  const containerWindow = ownerWindow(element);
  return containerWindow.getComputedStyle(element);
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

/**
 *
 * Demos:
 *
 * - [Collapsible](https://mui.com/base-ui/react-collapsible/#hooks)
 *
 * API:
 *
 * - [useCollapsibleContent API](https://mui.com/base-ui/react-collapsible/hooks-api/#use-collapsible-content)
 */
export function useCollapsibleContent(
  parameters: useCollapsibleContent.Parameters,
): useCollapsibleContent.ReturnValue {
  const {
    animated = false,
    htmlHidden = 'hidden',
    id: idParam,
    open,
    mounted: contextMounted,
    ref,
    setContentId,
    setMounted: setContextMounted,
    setOpen,
  } = parameters;

  const id = useId(idParam);

  const contentRef = React.useRef<HTMLElement | null>(null);

  const [height, setHeight] = React.useState(0);

  const latestAnimationNameRef = React.useRef<string | undefined>('none');
  const originalTransitionDurationStyleRef = React.useRef<string | undefined>();

  const isTransitioningRef = React.useRef(false);

  useEnhancedEffect(() => {
    setContentId(id);
    return () => {
      setContentId(undefined);
    };
  }, [id, setContentId]);

  const handleContentRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }

    contentRef.current = element;

    const computedStyles = getComputedStyles(element);

    latestAnimationNameRef.current = computedStyles.animationName ?? 'none';
    originalTransitionDurationStyleRef.current = element.style.transitionDuration;
  });

  const mergedRef = useForkRef(ref, handleContentRef);

  const runOnceAnimationsFinish = useAnimationsFinished(contentRef);

  const isOpen = animated ? open || contextMounted : open;

  const isInitialOpenRef = React.useRef(isOpen);

  const isBeforeMatchRef = React.useRef(false);

  useEnhancedEffect(() => {
    const { current: element } = contentRef;

    let frame1 = -1;
    let frame2 = -1;

    if (element) {
      const computedStyles = getComputedStyles(element);
      const currentAnimationName = computedStyles.animationName;
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

      const rect = element.getBoundingClientRect();

      if (!isTransitioning || !(open || contextMounted)) {
        setHeight(rect.height);
      }

      element.style.animationName = shouldCancelAnimation ? 'none' : originalAnimationName;
      element.style.transitionDuration = shouldCancelAnimation
        ? '0s'
        : originalTransitionDuration ?? '';

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

      if (currentAnimationName !== 'none') {
        latestAnimationNameRef.current = currentAnimationName;
      }
    }

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [open, contextMounted, runOnceAnimationsFinish, setContextMounted]);

  React.useEffect(() => {
    const { current: element } = contentRef;

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

  React.useEffect(
    function registerCssTransitionListeners() {
      const { current: element } = contentRef;
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
    },
    [open, setHeight],
  );

  // if `hidden="until-found"` content is revealed by browser's in-page search
  // we need to manually sync the open state
  React.useEffect(
    function registerBeforeMatchListener() {
      const { current: element } = contentRef;

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
    const { current: element } = contentRef;

    if (
      element &&
      supportsHiddenUntilFound(element) &&
      element?.hidden &&
      !isOpen &&
      htmlHidden === 'until-found'
    ) {
      // @ts-ignore
      element.hidden = 'until-found';
    }
  }, [htmlHidden, isOpen]);

  const getRootProps: useCollapsibleContent.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
        hidden: isOpen ? undefined : htmlHidden,
        ref: mergedRef,
      }),
    [htmlHidden, id, isOpen, mergedRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      height,
    }),
    [getRootProps, height],
  );
}

export namespace useCollapsibleContent {
  export interface Parameters {
    /**
     * If `true`, the component supports CSS/JS-based animations and transitions.
     * @default false
     */
    animated?: boolean;
    /**
     * The hidden state when closed
     * @default 'hidden'
     */
    htmlHidden?: 'hidden' | 'until-found';
    id?: React.HTMLAttributes<Element>['id'];
    mounted: boolean;
    /**
     * The open state of the Collapsible
     */
    open: boolean;
    ref: React.Ref<HTMLElement>;
    setContentId: (id: string | undefined) => void;
    setOpen: (nextOpen: boolean) => void;
    setMounted: (nextMounted: boolean) => void;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
    height: number;
  }
}
