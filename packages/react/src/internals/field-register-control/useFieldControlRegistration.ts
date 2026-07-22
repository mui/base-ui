'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { areArraysEqual } from '../areArraysEqual';
import { getCombinedFieldValidityData } from '../../field/utils/getCombinedFieldValidityData';
import { useFormContext } from '../form-context/FormContext';
import type { FieldValidityData } from '../../field/root/FieldRoot';

function areValuesEqual(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return areArraysEqual(a, b, Object.is);
  }
  return Object.is(a, b);
}

export interface FieldControlRegistration {
  controlRef: React.RefObject<any>;
  id: string | undefined;
  name?: string | undefined;
  getValue?: (() => unknown) | undefined;
  value: unknown;
  isValueEqual?: ((a: unknown, b: unknown) => boolean) | undefined;
}

export function useFieldControlRegistration(params: UseFieldControlRegistrationParameters) {
  const {
    commit,
    invalid,
    markedDirtyRef,
    name,
    setDirty,
    setRegisteredFieldName,
    registeredFieldIdRef,
    setValidityData,
    validityData,
  } = params;

  const { formRef } = useFormContext();

  const activeFieldControlSourceRef = React.useRef<symbol | null>(null);
  const registrationRef = React.useRef<FieldControlRegistration | null>(null);
  const syncedInitialValueSourceRef = React.useRef<symbol | null>(null);
  const lastKnownValueRef = React.useRef<unknown>(undefined);

  const getValueForForm = useStableCallback(() => {
    const registration = registrationRef.current;
    if (!registration) {
      return undefined;
    }

    if (registration.getValue) {
      return registration.getValue();
    }

    return registration.value;
  });

  function getRegistrationValue(registration: FieldControlRegistration) {
    return registration.value === undefined ? getValueForForm() : registration.value;
  }

  const validate = useStableCallback(() => {
    const registration = registrationRef.current;
    markedDirtyRef.current = true;

    if (!registration) {
      commit(validityData.value);
      return;
    }

    commit(getRegistrationValue(registration));
  });

  function refreshRegistration() {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: name ?? registration.name,
      controlRef: registration.controlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    });
  }

  function deleteRegistration(id = registrationRef.current?.id) {
    if (id) {
      formRef.current.fields.delete(id);
    }
  }

  function syncInitialValue() {
    const registration = registrationRef.current;
    if (!registration) {
      return;
    }

    const source = activeFieldControlSourceRef.current;

    if (syncedInitialValueSourceRef.current === source) {
      // The same control instance re-registering with a value update.
      if (registration.value !== undefined) {
        lastKnownValueRef.current = registration.value;
      }
      return;
    }

    const initialValue = getRegistrationValue(registration);
    const isValueEqual = registration.isValueEqual ?? areValuesEqual;

    // A new control instance registering with the previous instance's last known value is a
    // remount of the same logical control whose state lives above the mount boundary, so the
    // original baseline is kept. Any other value means a different control was swapped in and
    // must capture its own baseline. Values are compared with the control's own equality when
    // provided, and structurally for arrays otherwise, because controlled array-valued controls
    // may pass a newly allocated equivalent array on every render.
    const hadPreviousControl = syncedInitialValueSourceRef.current !== null;
    const isRemount = hadPreviousControl && isValueEqual(initialValue, lastKnownValueRef.current);

    syncedInitialValueSourceRef.current = source;
    lastKnownValueRef.current = initialValue;

    if (isRemount) {
      return;
    }

    if (hadPreviousControl) {
      setDirty(false);
    }

    setValidityData((prev) => {
      if (isValueEqual(prev.initialValue, initialValue)) {
        return prev;
      }

      return { ...prev, initialValue };
    });
  }

  useIsoLayoutEffect(() => {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }

    setRegisteredFieldName(name ? undefined : registration.name);

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: name ?? registration.name,
      controlRef: registration.controlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    });
  }, [formRef, getValueForForm, invalid, name, setRegisteredFieldName, validate, validityData]);

  useIsoLayoutEffect(() => {
    const fields = formRef.current.fields;

    return () => {
      const id = registrationRef.current?.id;
      if (id) {
        fields.delete(id);
      }
    };
  }, [formRef]);

  const register = useStableCallback(
    (source: symbol, registration: FieldControlRegistration | undefined) => {
      if (!registration) {
        if (activeFieldControlSourceRef.current === source) {
          activeFieldControlSourceRef.current = null;
          deleteRegistration();
          registrationRef.current = null;
          setRegisteredFieldName(undefined);
          registeredFieldIdRef.current = undefined;
        }
        return;
      }

      const previousId = registrationRef.current?.id;

      activeFieldControlSourceRef.current = source;
      registrationRef.current = registration;
      if (!name) {
        setRegisteredFieldName(registration.name);
      }
      registeredFieldIdRef.current = registration.id;

      if (previousId && previousId !== registration.id) {
        deleteRegistration(previousId);
      }

      syncInitialValue();
      refreshRegistration();
    },
  );

  return [validate, register] as const;
}

export interface UseFieldControlRegistrationParameters {
  commit: (value: unknown) => void;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  name: string | undefined;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setRegisteredFieldName: (name: string | undefined) => void;
  registeredFieldIdRef: React.RefObject<string | undefined>;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  validityData: FieldValidityData;
}
