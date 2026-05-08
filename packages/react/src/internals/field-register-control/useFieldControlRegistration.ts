'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getCombinedFieldValidityData } from '../../field/utils/getCombinedFieldValidityData';
import { useFormContext } from '../form-context/FormContext';
import type { FieldValidityData } from '../../field/root/FieldRoot';

export interface FieldControlRegistration {
  controlRef: React.RefObject<any>;
  id: string | undefined;
  getValue?: (() => unknown) | undefined;
  value: unknown;
}

export function useFieldControlRegistration(params: UseFieldControlRegistrationParameters) {
  const {
    commit,
    invalid,
    markedDirtyRef,
    name,
    setRegisteredFieldId,
    setValidityData,
    validityData,
  } = params;

  const { formRef } = useFormContext();

  const activeFieldControlSourceRef = React.useRef<symbol | null>(null);
  const registrationRef = React.useRef<FieldControlRegistration | null>(null);
  const fallbackControlRef = React.useRef<any>(null);

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

  const validate = useStableCallback(() => {
    const registration = registrationRef.current;
    if (!registration) {
      return;
    }

    let nextValue = registration.value;
    if (nextValue === undefined) {
      nextValue = getValueForForm();
    }

    markedDirtyRef.current = true;
    commit(nextValue);
  });

  function refreshRegistration() {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name,
      controlRef: registration.controlRef ?? fallbackControlRef,
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

    let initialValue = registration.value;
    if (initialValue === undefined) {
      initialValue = getValueForForm();
    }

    if (validityData.initialValue === null && initialValue !== null) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }

  useIsoLayoutEffect(() => {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }

    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name,
      controlRef: registration.controlRef ?? fallbackControlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    });
  }, [formRef, getValueForForm, invalid, name, validate, validityData]);

  useIsoLayoutEffect(() => {
    const fields = formRef.current.fields;

    return () => {
      const id = registrationRef.current?.id;
      if (id) {
        fields.delete(id);
      }
    };
  }, [formRef]);

  return useStableCallback((source: symbol, registration: FieldControlRegistration | undefined) => {
    if (!registration) {
      if (activeFieldControlSourceRef.current === source) {
        activeFieldControlSourceRef.current = null;
        deleteRegistration();
        registrationRef.current = null;
        setRegisteredFieldId(undefined);
      }
      return;
    }

    const previousId = registrationRef.current?.id;

    activeFieldControlSourceRef.current = source;
    registrationRef.current = registration;
    setRegisteredFieldId(registration.id);

    if (previousId && previousId !== registration.id) {
      deleteRegistration(previousId);
    }

    syncInitialValue();
    refreshRegistration();
  });
}

export interface UseFieldControlRegistrationParameters {
  commit: (value: unknown) => void;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  name: string | undefined;
  setRegisteredFieldId: (id: string | undefined) => void;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  validityData: FieldValidityData;
}
