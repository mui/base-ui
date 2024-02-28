'use client';
import * as React from 'react';
import { HelpTextProps, HelpTextOwnerState } from './HelpText.types';
import { FormFieldContextValue } from '../FormField';
import { useFormFieldContext } from '../FormField/useFormFieldContext';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const HelpText = React.forwardRef(function HelpText(
  props: HelpTextProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
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

  React.useEffect(() => {
    field?.registerChild('HelpText');
  }, [field]);

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
    focused: field?.focused,
  };

  const renderProps = {
    ...other,
    id: field?.helpTextId,
    children,
    ref: forwardedRef,
  };

  return render(renderProps, ownerState);
});

// @ts-ignore
HelpText.muiName = 'HelpText';

export { HelpText };
