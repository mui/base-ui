'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { LabelProps, LabelOwnerState } from './Label.types';
import { FormFieldContextValue, FieldOwnerStateCommonRequiredKeys } from '../FormField';
import { useFormFieldContext } from '../FormField/useFormFieldContext';

const useDataAttributes = (ownerState: LabelOwnerState) => {
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

function defaultRender(props: React.ComponentPropsWithRef<'label'>) {
  return <label {...props} htmlFor={props.htmlFor} />;
}

const Label = React.forwardRef(function Label(
  props: LabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement>,
) {
  const {
    disabled: disabledProp = false,
    invalid: invalidProp = false,
    touched: touchedProp = false,
    dirty: dirtyProp = false,
    children,
    render: renderProp,
    ...other
  } = props;

  const field: FormFieldContextValue | undefined = useFormFieldContext();

  const handleRef = useForkRef(forwardedRef, field?.registerLabel);

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
    focused: field?.focused ?? false,
  };

  const dataAttributes = useDataAttributes(ownerState);

  const renderProps = {
    ...other,
    ...dataAttributes,
    id: field?.labelId,
    children,
    ref: handleRef,
  };

  return render(renderProps, ownerState);
});

export { Label };
