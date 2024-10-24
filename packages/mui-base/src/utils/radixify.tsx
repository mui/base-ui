import * as React from 'react';
import { ComponentRenderFn } from './types';

type RadixifiedProps<
  Props extends { render?: ComponentRenderFn<any, any> | React.ReactElement<any> },
> = Omit<Props, 'render'> & {
  asChild?: boolean;
  children?: React.ReactNode;
};

export function radixify<
  Props extends { render?: ComponentRenderFn<any, any> | React.ReactElement<any> },
>(Component: React.ElementType<Props>): React.ElementType<RadixifiedProps<Props>> {
  return function Radixified(props: RadixifiedProps<Props>) {
    const { asChild = false, children, ...other } = props;

    if (asChild) {
      return (
        // @ts-ignore
        <Component {...other} render={children} />
      );
    }

    return (
      // @ts-ignore
      <Component {...other} />
    );
  };
}
