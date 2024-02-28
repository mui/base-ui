'use client';
import * as React from 'react';
import {
  unstable_useControlled as useControlled,
  unstable_useId as useId,
  unstable_isMuiElement as isMuiElement,
} from '@mui/utils';
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

  // child Label and HelpText needs to notify this context that a label exists
  // extract this into a hook
  const [hasLabel, setHasLabel] = React.useState(() => {
    let initialHasLabel = false;
    if (children) {
      React.Children.forEach(children, (child) => {
        if (!isMuiElement(child, ['Label'])) {
          return;
        }

        if (React.isValidElement(child) && isMuiElement(child, ['Label'])) {
          initialHasLabel = true;
        }
      });
    }
    return initialHasLabel;
  });

  const [hasHelpText, setHasHelpText] = React.useState(() => {
    let initialHasHelpText = false;
    if (children) {
      React.Children.forEach(children, (child) => {
        if (!isMuiElement(child, ['HelpText'])) {
          return;
        }

        if (React.isValidElement(child) && isMuiElement(child, ['HelpText'])) {
          initialHasHelpText = true;
        }
      });
    }
    return initialHasHelpText;
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
      hasLabel,
      setHasLabel,
      hasHelpText,
      setHasHelpText,
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
    hasLabel,
    setHasLabel,
    hasHelpText,
    setHasHelpText,
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
