'use client';
import { useStore } from '@base-ui/utils/store';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { TemporalSupportedValue } from '../../../types';
import { useField } from '../../../field/useField';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldElementsPropsPlugin } from './plugins/TemporalFieldElementsPropsPlugin';

interface UseTemporalFieldRootParameters<TValue extends TemporalSupportedValue> {
  store: TemporalFieldStore<TValue>;
}

interface UseTemporalFieldRootReturnValue {
  hiddenInputProps: ReturnType<typeof TemporalFieldElementsPropsPlugin.selectors.hiddenInputProps>;
  state: ReturnType<typeof TemporalFieldElementsPropsPlugin.selectors.rootState>;
  rootProps: ReturnType<typeof TemporalFieldElementsPropsPlugin.selectors.rootProps>;
  rootRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook managing the root state and props of a temporal field component.
 */
export function useTemporalFieldRoot<TValue extends TemporalSupportedValue>(
  params: UseTemporalFieldRootParameters<TValue>,
): UseTemporalFieldRootReturnValue {
  const { store } = params;

  const hiddenInputProps = useStore(
    store,
    TemporalFieldElementsPropsPlugin.selectors.hiddenInputProps,
    store,
  );
  const state = useStore(store, TemporalFieldElementsPropsPlugin.selectors.rootState);
  const rootProps = useStore(store, TemporalFieldElementsPropsPlugin.selectors.rootProps, store);
  const useFieldParams = useStore(store, TemporalFieldElementsPropsPlugin.selectors.useFieldParams);

  useField(useFieldParams);
  useOnMount(store.mountEffect);

  return {
    hiddenInputProps,
    state,
    rootProps,
    rootRef: useFieldParams.controlRef,
  };
}
