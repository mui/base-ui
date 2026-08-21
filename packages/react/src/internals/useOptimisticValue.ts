'use client';
// TODO: remove this fallback when React 19 is the minimum supported version.
/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

type UseOptimistic = <State>(
  passthrough: State,
) => [State, (action: State | ((pendingState: State) => State)) => void];

const ReactWithOptimistic = React as typeof React & {
  useOptimistic?: UseOptimistic | undefined;
};

export function useOptimisticValue<State>(passthrough: State) {
  const useReactOptimistic = ReactWithOptimistic.useOptimistic;

  if (useReactOptimistic) {
    return useReactOptimistic(passthrough);
  }

  const [optimisticValue, setOptimisticValue] = React.useState(passthrough);

  useIsoLayoutEffect(() => {
    setOptimisticValue(passthrough);
  }, [passthrough]);

  return [optimisticValue, setOptimisticValue] as const;
}
