'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { HelpTextProps, HelpTextOwnerState } from './HelpText.types';
import { FormFieldContextValue, FieldOwnerStateCommonRequiredKeys } from '../FormField';
import { useFormFieldContext } from '../FormField/useFormFieldContext';

const useDataAttributes = (ownerState: HelpTextOwnerState) => {
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

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const HelpText = React.forwardRef(function HelpText(
  props: HelpTextProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
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

  const handleRef = useForkRef(forwardedRef, field?.registerHelpText);

  // - field[prop] overrides direct prop
  // - this chunk of logic could be extracted into a hook or util
  const disabled = field?.disabled ?? disabledProp;
  const dirty = field?.dirty ?? dirtyProp;
  const invalid = field?.invalid ?? invalidProp;
  const touched = field?.touched ?? touchedProp;

  const render = renderProp ?? defaultRender;

  const ownerState: HelpTextOwnerState = {
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
    id: field?.helpTextId,
    children,
    ref: handleRef,
  };

  return render(renderProps, ownerState);
});

export { HelpText };
