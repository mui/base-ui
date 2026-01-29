'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { TemporalSupportedValue } from '../../../types';
import { useField } from '../../../field/useField';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldElementsPropsPlugin } from './plugins/TemporalFieldElementsPropsPlugin';
import { TemporalFieldSectionPlugin } from './plugins/TemporalFieldSectionPlugin';
import { TemporalFieldSection } from './types';

interface UseTemporalFieldRootParameters<TValue extends TemporalSupportedValue> {
  store: TemporalFieldStore<TValue>;
  children?: React.ReactNode | ((section: TemporalFieldSection) => React.ReactNode);
}

interface UseTemporalFieldRootReturnValue {
  hiddenInputProps: ReturnType<typeof TemporalFieldElementsPropsPlugin.selectors.hiddenInputProps>;
  state: ReturnType<typeof TemporalFieldElementsPropsPlugin.selectors.rootState>;
  resolvedChildren: React.ReactNode;
  getInputProps: () => {
    onClick: () => void;
    ref: React.RefObject<HTMLElement | null>;
  };
}

/**
 * Shared hook for DateFieldRoot and TimeFieldRoot that handles:
 * - Reading hiddenInputProps and state from the store
 * - Form integration via useField
 * - Resolving children with sections
 * - Returning input props (onClick and ref)
 */
export function useTemporalFieldRoot<TValue extends TemporalSupportedValue>(
  params: UseTemporalFieldRootParameters<TValue>,
): UseTemporalFieldRootReturnValue {
  const { store, children } = params;

  const hiddenInputProps = useStore(
    store,
    TemporalFieldElementsPropsPlugin.selectors.hiddenInputProps,
  );
  const state = useStore(store, TemporalFieldElementsPropsPlugin.selectors.rootState);
  const sections = useStore(store, TemporalFieldSectionPlugin.selectors.sections);
  const useFieldParams = useStore(store, TemporalFieldElementsPropsPlugin.selectors.useFieldParams);

  useField(useFieldParams);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return sections.map((section) => children(section));
    }

    return children;
  }, [children, sections]);

  const getInputProps = React.useCallback(
    () => ({
      onClick: store.elementsProps.handleRootClick,
      ref: useFieldParams.controlRef,
    }),
    [store.elementsProps.handleRootClick, useFieldParams.controlRef],
  );

  return {
    hiddenInputProps,
    state,
    resolvedChildren,
    getInputProps,
  };
}
