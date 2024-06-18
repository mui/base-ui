import * as React from 'react';
import {
  FormControl,
  useFormControlContext,
} from '@base_ui/react/legacy/FormControl';

export default function UseFormControl() {
  return (
    <FormControl defaultValue="" required>
      <CustomInput />
      <ControlStateDisplay />
    </FormControl>
  );
}

function CustomInput() {
  const formControlContext = useFormControlContext();

  if (formControlContext === undefined) {
    return null;
  }

  const { value, required, onChange, disabled, onFocus, onBlur } =
    formControlContext;

  return (
    <input
      value={value as string}
      required={required}
      onChange={onChange}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function ControlStateDisplay() {
  const formControlContext = useFormControlContext();
  if (formControlContext === undefined) {
    return null;
  }

  const { filled, focused } = formControlContext;

  return (
    <p>
      {filled ? 'filled' : 'empty'}&nbsp;|&nbsp;
      {focused ? 'focused' : 'not focused'}
    </p>
  );
}
