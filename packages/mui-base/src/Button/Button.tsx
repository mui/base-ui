import * as React from 'react';
import { ComponentRenderFn } from '../utils/types';

const Button = React.forwardRef(function Button(
  props: Button.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { behavior: ButtonBehavior, ...other } = props;
  if (ButtonBehavior) {
    return <ButtonBehavior render={<button type="button" {...other} ref={ref} />} />;
  }

  return <button type="button" {...other} ref={ref} />;
});

namespace Button {
  export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    behavior?: React.ComponentType<{ render?: ComponentRenderFn<any, any> | React.ReactElement }>;
  }
}

export { Button };
