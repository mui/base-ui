'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldRootContext } from '../field-root-context/FieldRootContext';
import type { FieldControlRegistration } from './useFieldControlRegistration';

export function useRegisterFieldControl(
  controlRef: FieldControlRegistration['controlRef'],
  id: FieldControlRegistration['id'],
  value: FieldControlRegistration['value'],
  getFormValueOverride?: FieldControlRegistration['getValue'],
) {
  const { registerFieldControl } = useFieldRootContext();
  const sourceRef = React.useRef<symbol | null>(null);

  if (!sourceRef.current) {
    sourceRef.current = Symbol();
  }

  useIsoLayoutEffect(() => {
    const source = sourceRef.current;

    if (!source || !id) {
      return undefined;
    }

    const registration: FieldControlRegistration = {
      controlRef,
      getValue: getFormValueOverride,
      id,
      value,
    };

    registerFieldControl(source, registration);

    return () => {
      registerFieldControl(source, undefined);
    };
  }, [controlRef, getFormValueOverride, id, registerFieldControl, value]);
}
