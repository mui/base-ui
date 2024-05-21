'use client';
import * as React from 'react';
import { useTransitionStatus } from './useTransitionStatus';
import { mergeReactProps } from '../utils/mergeReactProps';
import { ownerWindow } from '../utils/owner';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
/**
 *
 * API:
 *
 * - [useTransitionedElement API](https://mui.com/base-ui/api/use-transitioned-element/)
 */
export function useTransitionedElement(
  parameters: UseTransitionedElementParameters,
): UseTransitionedElementReturnValue {
  const { isRendered, elementRef } = parameters;
  const { onTransitionEnded, mounted } = useTransitionStatus(isRendered);

  useEnhancedEffect(() => {
    if (
      !isRendered &&
      (elementRef.current == null || !hasAnimationOrTransition(elementRef.current))
    ) {
      onTransitionEnded();
    }
  }, [isRendered, elementRef, onTransitionEnded]);

  const handleTransitionAndAnimationEnd = React.useCallback(() => {
    if (!isRendered) {
      onTransitionEnded();
    }
  }, [isRendered, onTransitionEnded]);

  const props = React.useMemo(
    () => ({
      onAnimationEnd: handleTransitionAndAnimationEnd,
      onTransitionEnd: handleTransitionAndAnimationEnd,
    }),
    [handleTransitionAndAnimationEnd],
  );

  const getRootProps = React.useCallback(
    (externalProps: React.HTMLAttributes<any> & React.RefAttributes<any> & Record<string, any>) =>
      mergeReactProps(externalProps, props),
    [props],
  );

  return {
    getRootProps,
    mounted,
  };
}

function hasAnimationOrTransition(element: HTMLElement) {
  const computedStyles = ownerWindow(element).getComputedStyle(element);
  const hasTransitionDuration = !['', '0s'].includes(computedStyles.transitionDuration);
  const hasAnimationName = !['', 'none'].includes(computedStyles.animationName);
  return hasTransitionDuration || hasAnimationName;
}

export interface UseTransitionedElementParameters {
  isRendered: boolean;
  elementRef: React.RefObject<HTMLElement>;
}

export interface UseTransitionedElementReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<any>,
  ) => React.ComponentPropsWithRef<any>;
  mounted: boolean;
}
