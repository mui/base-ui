'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';
import { useFormContext } from '../../form/FormContext';
import type { FieldValidityData } from './FieldRoot';

export interface FieldControlRegistration {
  controlRef: React.RefObject<any>;
  getValue?: (() => unknown) | undefined;
  id: string | undefined;
  value: unknown;
}

export function useFieldControlRegistration(params: UseFieldControlRegistrationParameters) {
  const { registration, commit, invalid, markedDirtyRef, name, setValidityData, validityData } =
    params;

  const { formRef } = useFormContext();

  const fallbackControlRef = React.useRef<any>(null);

  const id = registration?.id;
  const value = registration?.value;
  const controlRef = registration?.controlRef ?? fallbackControlRef;
  const getValue = useStableCallback(registration?.getValue ?? (() => value));

  useIsoLayoutEffect(() => {
    if (registration == null) {
      return;
    }

    let initialValue = value;
    if (initialValue === undefined) {
      initialValue = getValue();
    }

    if (validityData.initialValue === null && initialValue !== null) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }, [getValue, registration, setValidityData, validityData.initialValue, value]);

  useIsoLayoutEffect(() => {
    if (registration == null || !id) {
      return;
    }

    formRef.current.fields.set(id, {
      getValue,
      name,
      controlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate(flushSync = true) {
        let nextValue = value;
        if (nextValue === undefined) {
          nextValue = getValue();
        }

        markedDirtyRef.current = true;

        if (!flushSync) {
          commit(nextValue);
        } else {
          ReactDOM.flushSync(() => commit(nextValue));
        }
      },
    });
  }, [
    commit,
    controlRef,
    formRef,
    getValue,
    id,
    invalid,
    markedDirtyRef,
    name,
    registration,
    validityData,
    value,
  ]);

  useIsoLayoutEffect(() => {
    const fields = formRef.current.fields;

    return () => {
      if (id) {
        fields.delete(id);
      }
    };
  }, [formRef, id]);
}

export interface UseFieldControlRegistrationParameters {
  commit: (value: unknown) => void;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  name: string | undefined;
  registration: FieldControlRegistration | null;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  validityData: FieldValidityData;
}
