import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useUntrackedRef } from '@base-ui-components/utils/useUntrackedRef';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';
import { useFormContext } from '../form/FormContext';
import { useFieldRootContext } from './root/FieldRootContext';

export function useField(params: useField.Parameters) {
  const { formRef } = useFormContext();
  const { invalid, markedDirtyRef, validityData, setValidityData } = useFieldRootContext();
  const { enabled = true, value, id, name, controlRef, commitValidation } = params;

  const getValueRef = useUntrackedRef(params.getValue);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let initialValue = value;
    if (initialValue === undefined) {
      initialValue = getValueRef.current?.();
    }

    if (validityData.initialValue === null && initialValue !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }, [enabled, setValidityData, value, validityData.initialValue, getValueRef]);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    if (id) {
      formRef.current.fields.set(id, {
        controlRef,
        validityData: getCombinedFieldValidityData(validityData, invalid),
        validate() {
          let nextValue = value;
          if (nextValue === undefined) {
            nextValue = getValueRef.current?.();
          }

          markedDirtyRef.current = true;
          // Synchronously update the validity state so the submit event can be prevented.
          ReactDOM.flushSync(() => commitValidation(nextValue));
        },
        getValueRef,
        name,
      });
    }
  }, [
    commitValidation,
    controlRef,
    enabled,
    formRef,
    getValueRef,
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
  enabled?: boolean;
  value: unknown;
  getValue?: (() => unknown) | undefined;
  id: string | undefined;
  name?: string | undefined;
  commitValidation: (value: unknown) => void;
  /**
   * A ref to a focusable element that receives focus when the field fails
   * validation during form submission.
   */
  controlRef: React.RefObject<any>;
}

export namespace useField {
  export type Parameters = UseFieldParameters;
}
