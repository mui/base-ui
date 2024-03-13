'use client';
import * as React from 'react';
import { unstable_useId as useId } from '@mui/utils';
import { useControllableReducer } from '../utils/useControllableReducer';
import {
  FormFieldProps,
  FormFieldOwnerState,
  FieldState,
  FieldActionContext,
  FieldReducerAction,
  FieldOwnerStateCommonRequiredKeys,
} from './FormField.types';
import { FormFieldContext } from './FormFieldContext';
import { useRegisterSlot } from './useRegisterSlot';
import { FieldAction, FieldActionTypes } from './fieldAction.types';
import { fieldReducer } from './fieldReducer';

const useDataAttributes = (ownerState: FormFieldOwnerState) => {
  return (
    [
      'disabled',
      'focused',
      'invalid',
      'touched',
      'dirty',
    ] as Array<FieldOwnerStateCommonRequiredKeys>
  ).reduce((acc: Record<string, boolean>, prop: FieldOwnerStateCommonRequiredKeys) => {
    acc[`data-${prop}`] = ownerState[prop];
    return acc;
  }, {});
};

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  // TODO: support:
  // 1 - rendering a Fragment
  // 2 - rendering a <fieldset> and setting additional attributes e.g. disabled
  return <div {...props} />;
}

const FormField = React.forwardRef(function FormField(
  props: FormFieldProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    dirty: dirtyProp,
    disabled = false,
    focused: focusedProp,
    error: errorProp,
    invalid = false,
    required = false,
    touched: touchedProp,
    value: valueProp,
    defaultValue,
    id: idProp,
    name,
    children,
    render: renderProp,
    ...other
  } = props;

  // why does TS complain about this
  const id = useId(idProp) as string;
  const helpTextId = `${id}-help-text`;
  const labelId = `${id}-label`;

  const [hasLabel, registerLabel] = useRegisterSlot();
  const [hasHelpText, registerHelpText] = useRegisterSlot();
  // console.log('hasLabel:', hasLabel, '/', 'hasHelpText', hasHelpText);

  const { current: initialValueRef } = React.useRef(valueProp ?? defaultValue);

  const initialState = {
    value: initialValueRef,
    dirty: dirtyProp ?? false,
    focused: focusedProp ?? false,
    invalid,
    touched: touchedProp ?? false,
    error: errorProp ?? null,
  };

  const controlledState = React.useMemo(
    () => ({
      value: valueProp,
      dirty: dirtyProp,
      focused: focusedProp,
      invalid,
      error: errorProp,
    }),
    [valueProp, dirtyProp, focusedProp, invalid, errorProp],
  );

  const [state, dispatch] = useControllableReducer<FieldState, FieldAction, FieldActionContext>({
    reducer: fieldReducer as React.Reducer<FieldState, FieldReducerAction>,
    controlledProps: controlledState,
    initialState,
    actionContext: React.useMemo(
      () => ({
        disabled,
      }),
      [disabled],
    ),
    componentName: 'FormField',
  });

  const { value, dirty, error, focused, touched } = state;

  React.useEffect(() => {
    if (disabled) {
      dispatch({
        type: FieldActionTypes.blur,
        event: null,
      });
    } else if (focused) {
      dispatch({
        type: FieldActionTypes.focus,
        event: null,
      });
    }
  }, [disabled, focused, dispatch]);

  const render = renderProp ?? defaultRender;

  const ownerState: FormFieldOwnerState = {
    ...props,
    dirty,
    disabled,
    touched,
    focused,
    invalid,
  };

  const dataAttributes = useDataAttributes(ownerState);
  // console.log(dataAttributes);

  const childContext = React.useMemo(() => {
    return {
      id,
      name,
      helpTextId,
      labelId,
      value,
      dirty,
      disabled,
      focused,
      invalid,
      required,
      touched,
      error,
      dispatch,
      hasLabel,
      registerLabel,
      hasHelpText,
      registerHelpText,
      // + additionalContext somehow
    };
  }, [
    id,
    name,
    helpTextId,
    labelId,
    value,
    dirty,
    disabled,
    error,
    focused,
    invalid,
    required,
    touched,
    dispatch,
    hasLabel,
    registerLabel,
    hasHelpText,
    registerHelpText,
  ]);

  const renderProps = {
    ...other,
    ...dataAttributes,
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
