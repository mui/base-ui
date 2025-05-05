import * as ReactDOM from 'react-dom';
import { useModernLayoutEffect } from '../utils/useModernLayoutEffect';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';
import { useFormContext } from '../form/FormContext';
import { useFieldRootContext } from './root/FieldRootContext';
import { useLatestRef } from '../utils/useLatestRef';

export function useField(params: useField.Parameters) {
  const { formRef } = useFormContext();
  const { invalid, markedDirtyRef, validityData, setValidityData } = useFieldRootContext();
  const { value, id, controlRef, commitValidation } = params;

  const getValueRef = useLatestRef(params.getValue);

  useModernLayoutEffect(() => {
    let initialValue = value;
    if (initialValue === undefined) {
      initialValue = getValueRef.current?.();
    }

    if (validityData.initialValue === null && initialValue !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  }, [setValidityData, value, validityData.initialValue, getValueRef]);

  useModernLayoutEffect(() => {
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
    value: unknown;
    getValue?: () => unknown;
    id: string | undefined;
    commitValidation: (value: unknown) => void;
    controlRef: React.RefObject<any>;
  }
}
