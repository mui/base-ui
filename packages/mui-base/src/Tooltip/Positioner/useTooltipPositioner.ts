'use client';

import * as React from 'react';
import type {
  UseTooltipPositionerParameters,
  UseTooltipPositionerReturnValue,
} from './useTooltipPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

/**
 *
 * API:
 *
 * - [useTooltipPositioner API](https://mui.com/base-ui/api/use-tooltip-positioner/)
 */
export function useTooltipPositioner(
  params: UseTooltipPositionerParameters,
): UseTooltipPositionerReturnValue {
  const { open = false, keepMounted = false, followCursorAxis = 'none' } = params;

  const {
    positionerStyles,
    arrowStyles,
    hidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlignment,
  } = useAnchorPositioning(params);

  const getPositionerProps: UseTooltipPositionerReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if ((keepMounted && !open) || hidden) {
          hiddenStyles.pointerEvents = 'none';
        }

        if (followCursorAxis === 'both') {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          style: {
            ...positionerStyles,
            ...hiddenStyles,
            maxWidth: 'var(--available-width)',
            maxHeight: 'var(--available-height)',
            zIndex: 2147483647, // max z-index
          },
        });
      },
      [positionerStyles, hidden, followCursorAxis, open, keepMounted],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      side: renderedSide,
      alignment: renderedAlignment,
    }),
    [getPositionerProps, arrowRef, arrowUncentered, renderedSide, renderedAlignment, arrowStyles],
  );
}
