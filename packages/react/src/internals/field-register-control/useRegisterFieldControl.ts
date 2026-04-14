'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldRootContext } from '../field-root-context/FieldRootContext';
import type { FieldControlRegistration } from './useFieldControlRegistration';

export interface UseRegisterFieldControlParameters extends FieldControlRegistration {
  enabled?: boolean | undefined;
}

export function useRegisterFieldControl(
  controlRef: FieldControlRegistration['controlRef'],
  params: Omit<UseRegisterFieldControlParameters, 'controlRef'>,
) {
  const { enabled = true, getValue, id, value } = params;

  const { registerFieldControl } = useFieldRootContext();
  const sourceRef = React.useRef<symbol | null>(null);

  if (!sourceRef.current) {
    sourceRef.current = Symbol();
  }

  useIsoLayoutEffect(() => {
    const source = sourceRef.current;

    if (!source || !enabled) {
      return undefined;
    }

    registerFieldControl(source, {
      controlRef,
      getValue,
      id,
      value,
    });

    return () => {
      registerFieldControl(source, undefined);
    };
  }, [controlRef, enabled, getValue, id, registerFieldControl, value]);
}
