import * as React from 'react';
import { ComponentRenderFn } from '../utils/types';

const Button = React.forwardRef(function Button(
  props: Button.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { behavior: ButtonBehavior, ...other } = props;
  if (!ButtonBehavior) {
    return <button type="button" {...other} ref={ref} />;
  }

  if (!Array.isArray(ButtonBehavior)) {
    return <ButtonBehavior render={<button type="button" {...other} ref={ref} />} />;
  }

  return ButtonBehavior.reduceRight(
    (acc, Behavior) => {
      return <Behavior render={acc} />;
    },
    <button type="button" {...other} ref={ref} />,
  );
});

type Behavior =
  | React.ComponentType<{ render?: ComponentRenderFn<any, any> | React.ReactElement }>
  | Array<React.ComponentType<{ render?: ComponentRenderFn<any, any> | React.ReactElement }>>;

namespace Button {
  export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    behavior?: Behavior;
  }
}

export { Button };
