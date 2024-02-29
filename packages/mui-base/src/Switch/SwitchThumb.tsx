import * as React from 'react';
import { SwitchThumbProps } from './Switch.types';
import { resolveClassName } from '../utils/resolveClassName';
import { SwitchContext } from './SwitchContext';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumbProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render = defaultRender, className: classNameProp, ...other } = props;

  const ownerState = React.useContext(SwitchContext);
  if (ownerState === null) {
    throw new Error('Base UI: Switch.Thumb is not placed inside the Switch component.');
  }

  const { disabled, readOnly, required, checked } = ownerState;

  const className = resolveClassName(classNameProp, ownerState);

  const elementProps = {
    className,
    'data-disabled': disabled ? 'true' : undefined,
    'data-read-only': readOnly ? 'true' : undefined,
    'data-required': required ? 'true' : undefined,
    'data-state': checked ? 'checked' : 'unchecked',
    ref: forwardedRef,
    ...other,
  };

  return render(elementProps, ownerState);
});

export { SwitchThumb };
