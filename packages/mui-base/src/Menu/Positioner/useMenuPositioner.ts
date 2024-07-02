'use client';
import * as React from 'react';
import type {
  UseMenuPositionerParameters,
  UseMenuPositionerReturnValue,
} from './useMenuPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

/**
 *
 * API:
 *
 * - [useMenuPositioner API](https://mui.com/base-ui/api/use-menu-positioner/)
 */
export function useMenuPositioner(
  params: UseMenuPositionerParameters,
): UseMenuPositionerReturnValue {
  const { open = false } = params;

  const {
    positionerStyles,
    arrowStyles,
    hidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlignment,
    positionerContext: floatingContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: UseMenuPositionerReturnValue['getPositionerProps'] = React.useCallback(
    (externalProps = {}) => {
      const hiddenStyles: React.CSSProperties = {};

      if (!open || hidden) {
        hiddenStyles.pointerEvents = 'none';
      }

      return mergeReactProps(externalProps, {
        style: {
          ...positionerStyles,
          ...hiddenStyles,
          zIndex: 2147483647, // max z-index
        },
      });
    },
    [positionerStyles, open, hidden],
  );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      side: renderedSide,
      alignment: renderedAlignment,
      floatingContext,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlignment,
      floatingContext,
    ],
  );
}
