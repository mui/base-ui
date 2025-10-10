import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useUntracked } from '@base-ui-components/utils/useUntracked';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';
import { useFormContext } from '../form/FormContext';
import { useFieldRootContext } from './root/FieldRootContext';

export function useField(params: useField.Parameters) {
  const { formRef } = useFormContext();
  const { invalid, markedDirtyRef, validityData, setValidityData } = useFieldRootContext();
  const { enabled = true, value, id, name, controlRef, commitValidation } = params;

  const getValue = useUntracked(params.getValue);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let initialValue = value;
    if (initialValue === undefined) {
      initialValue = getValue();
    }

    if (validityData.initialValue === null && initialValue !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }, [enabled, setValidityData, value, validityData.initialValue, getValue]);

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
            nextValue = getValue();
          }

          markedDirtyRef.current = true;
          // Synchronously update the validity state so the submit event can be prevented.
          ReactDOM.flushSync(() => commitValidation(nextValue));
        },
        getValue,
        name,
      });
    }
  }, [
    commitValidation,
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
