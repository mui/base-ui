'use client';
import * as React from 'react';
import { useTransitionStatus } from './useTransitionStatus';
import { mergeReactProps } from '../utils/mergeReactProps';

export interface UseTransitionedElementParameters {
  isRendered: boolean;
  enabled: boolean;
}

export function useTransitionedElement(parameters: UseTransitionedElementParameters) {
  const { isRendered, enabled } = parameters;
  const { notifyTransitionEnded, mounted, openState } = useTransitionStatus(isRendered, enabled);

  const handleTransitionAndAnimationEnd = React.useCallback(() => {
    if (!isRendered) {
      notifyTransitionEnded();
    }
  }, [isRendered, notifyTransitionEnded]);

  const props = React.useMemo(
    () =>
      enabled
        ? {
            onAnimationEnd: handleTransitionAndAnimationEnd,
            onTransitionEnd: handleTransitionAndAnimationEnd,
          }
        : {},
    [handleTransitionAndAnimationEnd, enabled],
  );

  const getRootProps = React.useCallback(
    (externalProps: React.HTMLAttributes<any> & React.RefAttributes<any> & Record<string, any>) =>
      mergeReactProps(externalProps, props),
    [props],
  );

  return {
    getRootProps,
    mounted,
    openState,
  };
}
