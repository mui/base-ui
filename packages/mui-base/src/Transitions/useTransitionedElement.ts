'use client';
import * as React from 'react';
import { OpenState, useTransitionStatus } from './useTransitionStatus';
import { mergeReactProps } from '../utils/mergeReactProps';

export function useTransitionedElement(
  parameters: UseTransitionedElementParameters,
): UseTransitionedElementReturnValue {
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

export interface UseTransitionedElementParameters {
  isRendered: boolean;
  enabled: boolean;
}

export interface UseTransitionedElementReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<any>,
  ) => React.ComponentPropsWithRef<any>;
  mounted: boolean;
  openState: OpenState;
}
