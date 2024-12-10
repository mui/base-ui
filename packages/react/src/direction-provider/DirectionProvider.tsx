'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DirectionContext, type TextDirection } from './DirectionContext';

/**
 * A provider that configures RTL/LTR behavior for part of an app or a whole app.
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

DirectionProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The reading direction of the text
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
} as any;
