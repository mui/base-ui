import * as ReactDOM from 'react-dom';
import { useModernLayoutEffect } from '../utils/useModernLayoutEffect';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';
import { useFormContext } from '../form/FormContext';
import { useFieldRootContext } from './root/FieldRootContext';
import { useLatestRef } from '../utils/useLatestRef';

export function useField(params: useField.Parameters) {
  const { formRef } = useFormContext();
  const { invalid, markedDirtyRef, validityData, setValidityData } = useFieldRootContext();
  const { enabled = true, value, id, controlRef, commitValidation } = params;

  const getValueRef = useLatestRef(params.getValue);

  useModernLayoutEffect(() => {
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

  useModernLayoutEffect(() => {
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
    validityData,
    value,
  ]);
}

export namespace useField {
  export interface Parameters {
    enabled?: boolean;
    value: unknown;
    getValue?: () => unknown;
    id: string | undefined;
    commitValidation: (value: unknown) => void;
    controlRef: React.RefObject<any>;
  }
}
