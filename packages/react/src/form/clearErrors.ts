import type * as React from 'react';
import { Errors } from './FormContext';

export function clearErrors(
  name: string | undefined,
  onClearErrors: React.Dispatch<React.SetStateAction<Errors>>,
) {
  onClearErrors((prevErrors) => {
    if (name && {}.hasOwnProperty.call(prevErrors, name)) {
      const nextErrors = { ...prevErrors };
      delete nextErrors[name];
      return nextErrors;
    }
    return prevErrors;
  });
}
