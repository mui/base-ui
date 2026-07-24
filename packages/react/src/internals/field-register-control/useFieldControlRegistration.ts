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
  name?: string | undefined;
  getValue?: (() => unknown) | undefined;
  value: unknown;
}

export function useFieldControlRegistration(params: UseFieldControlRegistrationParameters) {
  const {
    commit,
    invalid,
    isDisabled,
    markedDirtyRef,
    name,
    setRegisteredFieldName,
    registeredFieldIdRef,
    setValidityData,
    validityData,
  } = params;

  const { formRef } = useFormContext();

  const activeFieldControlSourceRef = React.useRef<symbol | null>(null);
  const registrationRef = React.useRef<FieldControlRegistration | null>(null);
  const initialValueCapturedRef = React.useRef(false);

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
    if (isDisabled()) {
      return;
    }

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
      isDisabled,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    });
  }

  function deleteRegistration(id = registrationRef.current?.id) {
    if (id) {
      formRef.current.fields.delete(id);
    }
  }

  // The baseline belongs to the field, not to a control instance: registration re-runs on every
  // value change, and a control that unmounts and remounts (or is swapped for another one) comes
  // back as a brand new registration. Capturing more than once would turn whichever value the
  // control happens to hold at that point into the initial value, so a modified field would read
  // pristine and its real initial value would read dirty. Consumers that want a fresh baseline
  // remount or key `<Field.Root>` itself.
  function captureInitialValue(registration: FieldControlRegistration) {
    if (initialValueCapturedRef.current) {
      return;
    }

    initialValueCapturedRef.current = true;
    const initialValue = getRegistrationValue(registration);

    setValidityData((prev) =>
      prev.initialValue === initialValue ? prev : { ...prev, initialValue },
    );
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
      isDisabled,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate,
    });
  }, [
    formRef,
    getValueForForm,
    invalid,
    isDisabled,
    name,
    setRegisteredFieldName,
    validate,
    validityData,
  ]);

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

      captureInitialValue(registration);
      refreshRegistration();
    },
  );

  return [validate, register] as const;
}

export interface UseFieldControlRegistrationParameters {
  commit: (value: unknown) => void;
  invalid: boolean;
  isDisabled: () => boolean;
  markedDirtyRef: React.RefObject<boolean>;
  name: string | undefined;
  setRegisteredFieldName: (name: string | undefined) => void;
  registeredFieldIdRef: React.RefObject<string | undefined>;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  validityData: FieldValidityData;
}
