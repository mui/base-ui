'use client';
import * as React from 'react';
import { DirectionContext, type TextDirection } from './DirectionContext';

/**
 * A provider that configures RTL/LTR behavior for part of an app or a whole app.
 *
 * Demos:
 *
 * - [Progress](https://base-ui.com/components/react-direction-provider/)
 *
 * API:
 *
 * - [DirectionProvider API](https://base-ui.com/components/react-direction-provider/#api-reference-DirectionProvider)
 */
const DirectionProvider: React.FC<DirectionProvider.Props> = function DirectionProvider(props) {
  const { direction = 'ltr', children } = props;
  const contextValue = React.useMemo(() => ({ direction }), [direction]);
  return <DirectionContext.Provider value={contextValue}>{children}</DirectionContext.Provider>;
};

namespace DirectionProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The reading direction of the text
     * @default 'ltr'
     */
    direction?: TextDirection;
  }
}

export { DirectionProvider };
