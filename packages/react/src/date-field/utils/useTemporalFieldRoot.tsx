'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { TemporalSupportedValue } from '../../types';
import { useField } from '../../field/useField';
import { TemporalFieldStore } from './TemporalFieldStore';
import { DateFieldSectionList } from '../section-list/DateFieldSectionList';
import { selectors } from './selectors';
import { TemporalFieldSection } from './types';

interface UseTemporalFieldRootParameters<TValue extends TemporalSupportedValue> {
  store: TemporalFieldStore<TValue>;
  children?: React.ReactNode | ((section: TemporalFieldSection, index: number) => React.ReactNode);
}

interface UseTemporalFieldRootReturnValue {
  hiddenInputProps: ReturnType<typeof selectors.hiddenInputProps>;
  state: ReturnType<typeof selectors.rootState>;
  rootRef: React.RefObject<HTMLElement | null>;
  resolvedChildren: React.ReactNode;
}

/**
 * Hook managing the root state and props of a temporal field component.
 */
export function useTemporalFieldRoot<TValue extends TemporalSupportedValue>(
  params: UseTemporalFieldRootParameters<TValue>,
): UseTemporalFieldRootReturnValue {
  const { store, children } = params;

  const hiddenInputProps = store.useState('hiddenInputProps');
  const state = store.useState('rootState');
  const useFieldParams = store.useState('useFieldParams');

  useField(useFieldParams);
  useOnMount(store.mountEffect);

  const resolvedChildren =
    typeof children === 'function' ? (
      <DateFieldSectionList>{children}</DateFieldSectionList>
    ) : (
      children
    );

  return {
    hiddenInputProps,
    state,
    rootRef: useFieldParams.controlRef,
    resolvedChildren,
  };
}
