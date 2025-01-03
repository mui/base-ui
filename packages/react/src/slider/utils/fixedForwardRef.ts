import * as React from 'react';

export function fixedForwardRef<T, P extends React.PropsWithoutRef<any> = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T>) => React.ReactNode {
  return React.forwardRef(render) as any;
}
