'use client';
import * as React from 'react';
import useControlled from '@mui/utils/useControlled';
import useId from '@mui/utils/useId';
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
    dirty: dirtyProp,
    disabled = false,
    error = null,
    invalid = false,
    touched,
    value: valueProp,
    defaultValue,
    id: idProp,
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

  // why does TS complain about this
  const id = useId(idProp) as string;
  const helpTextId = `${id}-help-text`;
  const labelId = `${id}-label`;

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
    dirty: isDirty,
    touched: isTouched,
    focused,
  };

  const childContext = React.useMemo(() => {
    return {
      id,
      helpTextId,
      labelId,
      value,
      setValue,
      disabled,
      invalid,
      dirty: isDirty,
      touched: isTouched,
      focused,
      setFocused,
      error,
      // + additionalContext somehow
    };
  }, [
    id,
    helpTextId,
    labelId,
    value,
    setValue,
    disabled,
    invalid,
    isDirty,
    isTouched,
    focused,
    setFocused,
    error,
  ]);

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
