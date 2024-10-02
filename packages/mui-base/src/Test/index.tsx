import * as React from 'react';

export function Root<Value>(props: Root.Props<Value>) {
  return <div />;
}

namespace Root {
  export interface Props<Value = any> {
    value?: Value;
    defaultValue?: Value;
    onValueChange?: (value: Value, event?: Event) => void;
  }
}
