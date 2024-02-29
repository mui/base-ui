import * as React from 'react';
import { SwitchThumbProps } from './Switch.types';
import { SwitchContext } from './SwitchContext';
import { resolveClassName } from '../utils/resolveClassName';
import { getStyleHookProps } from '../utils/getStyleHookProps';

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

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = React.useMemo(() => {
    return getStyleHookProps(ownerState, {
      checked: (value) => (value === true ? { 'data-state': 'checked' } : null),
    });
  }, [ownerState]);

  const elementProps = {
    className,
    ref: forwardedRef,
    ...styleHooks,
    ...other,
  };

  return render(elementProps, ownerState);
});

export { SwitchThumb };
