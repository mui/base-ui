'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import { exactProp } from '../utils/proptypes';
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
function NoSsr(props: NoSsrProps): React.JSX.Element {
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

  // We need the Fragment here to force react-docgen to recognise NoSsr as a component.
  return <React.Fragment>{mountedState ? children : fallback}</React.Fragment>;
}

NoSsr.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * You can wrap a node.
   */
  children: PropTypes.node,
  /**
   * If `true`, the component will not only prevent server-side rendering.
   * It will also defer the rendering of the children into a different screen frame.
   * @default false
   */
  defer: PropTypes.bool,
  /**
   * The fallback content to display.
   * @default null
   */
  fallback: PropTypes.node,
} as any;

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line
  (NoSsr as any)['propTypes' + ''] = exactProp(NoSsr.propTypes);
}

export { NoSsr };
