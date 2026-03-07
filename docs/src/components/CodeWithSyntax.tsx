import clsx from 'clsx';
import * as React from 'react';

export function CodeWithSyntax(props: React.ComponentProps<'code'>) {
  return <code {...props} className={clsx('CodeWithSyntax', props.className)} />;
}
