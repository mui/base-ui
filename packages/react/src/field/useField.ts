import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';
import { useFormContext } from '../form/FormContext';
import { useFieldRootContext } from './root/FieldRootContext';

export function useField(params: UseFieldParameters) {
  const { enabled = true, value, id, name, controlRef, commit } = params;

  const { formRef } = useFormContext();
  const { invalid, markedDirtyRef, validityData, setValidityData } = useFieldRootContext();

  const getValue = useStableCallback(params.getValue);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let initialValue = value;
    if (initialValue === undefined) {
      initialValue = getValue();
    }

    if (validityData.initialValue === null && initialValue !== null) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }, [enabled, setValidityData, value, validityData.initialValue, getValue]);

  useIsoLayoutEffect(() => {
    if (!enabled || !id) {
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
          // Synchronously update the validity state so the submit event can be prevented.
          ReactDOM.flushSync(() => commit(nextValue));
        }
      },
    });
  }, [
    commit,
    controlRef,
    enabled,
    formRef,
    getValue,
    id,
    invalid,
    markedDirtyRef,
    name,
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

export interface UseFieldParameters {
  enabled?: boolean | undefined;
  value: unknown;
  getValue?: (() => unknown) | undefined;
  id: string | undefined;
  name?: string | undefined;
  commit: (value: unknown) => void;
  /**
   * A ref to a focusable element that receives focus when the field fails
   * validation during form submission.
   */
  controlRef: React.RefObject<any>;
}
