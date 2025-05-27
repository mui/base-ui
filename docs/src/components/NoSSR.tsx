'use client';
import * as React from 'react';

export function NoSSR(props: { defer?: boolean; children: any }): React.JSX.Element {
  const { children, defer = false } = props;
  const [mountedState, setMountedState] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!defer) {
      setMountedState(true);
    }
  }, [defer]);
  React.useEffect(() => {
    if (defer) {
      setMountedState(true);
    }
  }, [defer]);
  return (mountedState ? children : null) as React.JSX.Element;
}
