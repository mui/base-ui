'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldRootContext } from './FieldRootContext';
import type { FieldControlRegistration } from './useFieldControlRegistration';

export interface UseRegisterFieldControlParameters extends FieldControlRegistration {}

export function useRegisterFieldControl(params: UseRegisterFieldControlParameters) {
  const { controlRef, enabled = true, getValue, id, value } = params;

  const { registerFieldControl } = useFieldRootContext();
  const sourceRef = React.useRef<symbol | null>(null);

  if (sourceRef.current == null) {
    sourceRef.current = Symbol();
  }

  useIsoLayoutEffect(() => {
    const source = sourceRef.current;

    if (source == null) {
      return undefined;
    }

    registerFieldControl(source, {
      controlRef,
      enabled,
      getValue,
      id,
      value,
    });

    return () => {
      registerFieldControl(source, undefined);
    };
  }, [controlRef, enabled, getValue, id, registerFieldControl, value]);
}
