'use client';
import * as React from 'react';
import { DirectionContext, type TextDirection } from './DirectionContext';

/**
 * Enables RTL behavior for Base UI components.
 *
 * Documentation: [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
 */
export const DirectionProvider: React.FC<DirectionProvider.Props> = function DirectionProvider(
  props,
) {
  const { direction = 'ltr' } = props;
  const contextValue = React.useMemo(() => ({ direction }), [direction]);
  return (
    <DirectionContext.Provider value={contextValue}>{props.children}</DirectionContext.Provider>
  );
};

export interface DirectionProviderProps {
  children?: React.ReactNode;
  /**
   * The reading direction of the text
   * @default 'ltr'
   */
  direction?: TextDirection;
}

export namespace DirectionProvider {
  export type Props = DirectionProviderProps;
}
