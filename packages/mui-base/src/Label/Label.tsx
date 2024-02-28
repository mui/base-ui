'use client';
import * as React from 'react';
import { LabelProps, LabelOwnerState } from './Label.types';
import { FormFieldContextValue } from '../FormField';
import { useFormFieldContext } from '../FormField/useFormFieldContext';

function defaultRender(props: React.ComponentPropsWithRef<'label'>) {
  return <label {...props} htmlFor={props.htmlFor} />;
}

const Label = React.forwardRef(function Label(
  props: LabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement>,
) {
  const {
    disabled: disabledProp,
    invalid: invalidProp,
    touched: touchedProp,
    dirty: dirtyProp,
    children,
    render: renderProp,
    ...other
  } = props;

  const field: FormFieldContextValue | undefined = useFormFieldContext();

  // - field[prop] overrides direct prop
  // - this chunk of logic could be extracted into a hook or util
  const disabled = field?.disabled ?? disabledProp;
  const dirty = field?.dirty ?? dirtyProp;
  const invalid = field?.invalid ?? invalidProp;
  const touched = field?.touched ?? touchedProp;

  const render = renderProp ?? defaultRender;

  const ownerState: LabelOwnerState = {
    ...props,
    disabled,
    dirty,
    invalid,
    touched,
    focused: field?.focused,
  };

  const renderProps = {
    ...other,
    children,
    ref: forwardedRef,
  };

  return render(renderProps, ownerState);
});

export { Label };
