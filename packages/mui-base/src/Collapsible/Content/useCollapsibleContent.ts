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

  const heightRef = React.useRef(0);
  const { current: height } = heightRef;

  const latestAnimationNameRef = React.useRef('none');

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
  });

  const mergedRef = useForkRef(ref, handleContentRef);

  const runOnceAnimationsFinish = useAnimationsFinished(contentRef);

  const isOpen = open || contextMounted;

  const isInitialOpenRef = React.useRef(isOpen);

  useEnhancedEffect(() => {
    const { current: element } = contentRef;

    if (element) {
      const computedStyles = getComputedStyles(element);

      const prevAnimationName = latestAnimationNameRef.current;
      const currentAnimationName = computedStyles.animationName;

      const originalAnimationName =
        element.style.animationName === 'none' ? '' : element.style.animationName;

      element.style.animationName = 'none';

      const isAnimatingOut = prevAnimationName !== currentAnimationName && !open && contextMounted;

      if (open || isAnimatingOut) {
        const rect = element.getBoundingClientRect();
        heightRef.current = rect.height;
      }

      element.style.animationName = isInitialOpenRef.current ? 'none' : originalAnimationName;

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
    const frame = requestAnimationFrame(() => {
      isInitialOpenRef.current = false;
    });

    return () => cancelAnimationFrame(frame);
  }, []);

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
      isOpen,
      height,
    }),
    [getRootProps, isOpen, height],
  );
}

export { useCollapsibleContent };
