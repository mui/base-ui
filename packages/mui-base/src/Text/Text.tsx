import * as React from 'react';
import { ComponentRenderFn } from '../utils/types';

const Text = React.forwardRef(function Text(props: Text.Props, ref: React.ForwardedRef<any>) {
  const { behavior: TextBehavior, tag: Element = 'span', ...other } = props;
  if (TextBehavior) {
    return <TextBehavior render={<Element {...other} ref={ref} />} />;
  }

  return <Element {...other} ref={ref} />;
});

namespace Text {
  export interface Props extends React.HTMLAttributes<HTMLSpanElement> {
    behavior?: React.ComponentType<{
      render?: ComponentRenderFn<any, any> | React.ReactElement;
    }>;
    tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }
}

export { Text };
