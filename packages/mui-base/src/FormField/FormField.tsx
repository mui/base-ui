'use client';
import * as React from 'react';
import useControlled from '@mui/utils/useControlled';
import { FormFieldProps, FormFieldOwnerState } from './FormField.types';
import { FormFieldContext } from './FormFieldContext';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div data-testid="FormField" {...props} />;
}

const FormField = React.forwardRef(function FormField(
  props: FormFieldProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    disabled,
    value: valueProp,
    defaultValue,
    children,
    render: renderProp,
    ...other
  } = props;

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FormField',
    state: 'value',
  });

  const { current: initialValueRef } = React.useRef(valueProp ?? defaultValue);

  const [isDirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (initialValueRef !== value) {
      if (!isDirty) {
        setDirty(true);
      }
    }
  }, [isDirty, setDirty, initialValueRef, value]);

  const [focusedState, setFocused] = React.useState(false);
  const focused = focusedState && !disabled;

  React.useEffect(() => setFocused((isFocused) => (disabled ? false : isFocused)), [disabled]);

  const [isTouched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (focusedState && !isTouched) {
      setTouched(true);
    }
  }, [focusedState, isTouched, setTouched]);

  const render = renderProp ?? defaultRender;

  const ownerState: FormFieldOwnerState = {
    ...props,
    disabled,
    dirty: isDirty,
    focused,
  };

  const childContext = React.useMemo(() => {
    return {
      value,
      defaultValue,
      setValue,
      disabled,
      dirty: isDirty,
      focused,
      setFocused,
    };
  }, [value, defaultValue, setValue, disabled, isDirty, focused, setFocused]);

  const renderProps = {
    ...other,
    children,
    ref: forwardedRef,
  };

  return (
    <FormFieldContext.Provider value={childContext}>
      {render(renderProps, ownerState)}
    </FormFieldContext.Provider>
  );
});

export { FormField };
