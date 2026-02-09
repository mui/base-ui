'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { TemporalSupportedValue } from '../../../types';
import { useField } from '../../../field/useField';
import { TemporalFieldStore } from './TemporalFieldStore';
import { selectors } from './selectors';

interface UseTemporalFieldRootParameters<TValue extends TemporalSupportedValue> {
  store: TemporalFieldStore<TValue>;
}

interface UseTemporalFieldRootReturnValue {
  hiddenInputProps: ReturnType<typeof selectors.hiddenInputProps>;
  state: ReturnType<typeof selectors.rootState>;
  rootProps: ReturnType<typeof selectors.rootProps>;
  rootRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook managing the root state and props of a temporal field component.
 */
export function useTemporalFieldRoot<TValue extends TemporalSupportedValue>(
  params: UseTemporalFieldRootParameters<TValue>,
): UseTemporalFieldRootReturnValue {
  const { store } = params;

  const hiddenInputProps = store.useState('hiddenInputProps', store);
  const state = store.useState('rootState');
  const rootProps = store.useState('rootProps', store);
  const useFieldParams = store.useState('useFieldParams');

  useField(useFieldParams);
  useOnMount(store.mountEffect);

  return {
    hiddenInputProps,
    state,
    rootProps,
    rootRef: useFieldParams.controlRef,
  };
}
