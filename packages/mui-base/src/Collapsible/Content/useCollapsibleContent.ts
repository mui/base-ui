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
import {
  UseCollapsibleContentParameters,
  UseCollapsibleContentReturnValue,
} from './CollapsibleContent.types';

function getComputedStyles(element: HTMLElement) {
  const containerWindow = ownerWindow(element);
  return containerWindow.getComputedStyle(element);
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
function useCollapsibleContent(
  parameters: UseCollapsibleContentParameters,
): UseCollapsibleContentReturnValue {
  const {
    id: idParam,
    open,
    mounted: contextMounted,
    ref,
    setContentId,
    setMounted: setContextMounted,
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

  const isOpen = open || contextMounted;

  const isInitialOpenRef = React.useRef(isOpen);

  useEnhancedEffect(() => {
    const { current: element } = contentRef;

    if (element) {
      const computedStyles = getComputedStyles(element);

      const currentAnimationName = computedStyles.animationName;

      const originalAnimationName =
        element.style.animationName === 'none' ? '' : element.style.animationName;

      element.style.animationName = 'none';

      const rect = element.getBoundingClientRect();

      if (!isTransitioningRef.current || !(open || contextMounted)) {
        setHeight(rect.height);
      }

      element.style.animationName = isInitialOpenRef.current ? 'none' : originalAnimationName;
      element.style.transitionDuration = isInitialOpenRef.current
        ? '0s'
        : originalTransitionDurationStyleRef.current ?? '';

      runOnceAnimationsFinish(() => {
        ReactDOM.flushSync(() => {
          setContextMounted(open);
        });
      });

      if (currentAnimationName !== 'none') {
        latestAnimationNameRef.current = currentAnimationName;
      }
    }
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

  const getRootProps: UseCollapsibleContentReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
        hidden: isOpen ? undefined : 'hidden',
        ref: mergedRef,
      }),
    [id, isOpen, mergedRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      height,
    }),
    [getRootProps, height],
  );
}

export { useCollapsibleContent };
