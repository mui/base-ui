'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import { NoSsrProps } from './NoSsr.types';

/**
 * NoSsr purposely removes components from the subject of Server Side Rendering (SSR).
 *
 * This component can be useful in a variety of situations:
 *
 * * Escape hatch for broken dependencies not supporting SSR.
 * * Improve the time-to-first paint on the client by only rendering above the fold.
 * * Reduce the rendering time on the server.
 * * Under too heavy server load, you can turn on service degradation.
 *
 * Documentation: [Base UI Unstable No Ssr](https://base-ui.com/react/components/unstable-no-ssr)
 */
export function NoSsr(props: NoSsrProps): React.JSX.Element {
  const { children, defer = false, fallback = null } = props;
  const [mountedState, setMountedState] = React.useState(false);

  useEnhancedEffect(() => {
    if (!defer) {
      setMountedState(true);
    }
  }, [defer]);

  React.useEffect(() => {
    if (defer) {
      setMountedState(true);
    }
  }, [defer]);

  // TODO casting won't be needed at one point https://github.com/DefinitelyTyped/DefinitelyTyped/pull/65135
  // We could replace React.JSX.Element with React.ReactNode.
  // But first, we need to bump min typescript support to version to 5.1 and enough people to adopt the above change.
  return (mountedState ? children : fallback) as React.JSX.Element;
}
