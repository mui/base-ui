'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useFieldRootContext } from '../field-root-context/FieldRootContext';
import type { FieldControlRegistration } from './useFieldControlRegistration';

export function useRegisterFieldControl(
  controlRef: FieldControlRegistration['controlRef'],
  id: FieldControlRegistration['id'],
  value: FieldControlRegistration['value'],
  getFormValueOverride?: FieldControlRegistration['getValue'],
  enabled = true,
  name?: FieldControlRegistration['name'],
) {
  const { registerFieldControl } = useFieldRootContext();
  const sourceRef = useRefWithInit(() => Symbol());

  // Re-register without unregistering first: re-registration with the same id updates the
  // form's fields Map entry in place, while a delete + re-add would move the field to the
  // end of the Map every time its value changes.
  useIsoLayoutEffect(() => {
    const source = sourceRef.current;

    if (!enabled) {
      registerFieldControl(source, undefined);
      return;
    }

    const registration: FieldControlRegistration = {
      controlRef,
      getValue: getFormValueOverride,
      id,
      name,
      value,
    };

    registerFieldControl(source, registration);
  }, [controlRef, enabled, getFormValueOverride, id, name, registerFieldControl, sourceRef, value]);

  useIsoLayoutEffect(() => {
    const source = sourceRef.current;
    return () => {
      registerFieldControl(source, undefined);
    };
  }, [registerFieldControl, sourceRef]);
}
