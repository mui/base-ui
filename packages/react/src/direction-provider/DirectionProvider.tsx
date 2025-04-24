'use client';
import * as React from 'react';
import { DirectionContext, type TextDirection } from './DirectionContext';

/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
const DirectionProvider: React.FC<DirectionProvider.Props> = function DirectionProvider(props) {
  const { direction = 'ltr' } = props;
  const contextValue = React.useMemo(() => ({ direction }), [direction]);
  return (
    <DirectionContext.Provider value={contextValue}>{props.children}</DirectionContext.Provider>
  );
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
