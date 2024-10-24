import * as React from 'react';
import { MenuTrigger } from './MenuTrigger';

export function asMenuTrigger<Props>(
  Component: React.ElementType<Props>,
  settings?: MenuTrigger.Props,
): React.ElementType<Props> {
  return function AsMenuTrigger(props: Props) {
    return (
      <MenuTrigger
        {...settings}
        // TODO: merge props properly
        // @ts-ignore
        render={(triggerProps) => <Component {...props} {...triggerProps} />}
      />
    );
  };
}
