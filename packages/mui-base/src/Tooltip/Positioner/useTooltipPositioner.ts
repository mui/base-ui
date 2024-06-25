'use client';
import * as React from 'react';
import type {
  UseTooltipPositionerParameters,
  UseTooltipPositionerReturnValue,
} from './useTooltipPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

/**
 * Manages the popup state for a tooltip including positioning.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/#hooks)
 *
 * API:
 *
 * - [useTooltipPositioner API](https://mui.com/base-ui/react-tooltip/hooks-api/#use-tooltip-positioner)
 */
export function useTooltipPositioner(
  params: UseTooltipPositionerParameters,
): UseTooltipPositionerReturnValue {
  const {
    open,
    keepMounted = false,
    mounted = true,
    getRootPositionerProps,
    followCursorAxis = 'none',
  } = params;

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

        return mergeReactProps(
          externalProps,
          getRootPositionerProps({
            style: {
              ...positionerStyles,
              maxWidth: 'var(--available-width)',
              maxHeight: 'var(--available-height)',
              zIndex: 2147483647, // max z-index
            },
          }),
        );
      },
      [getRootPositionerProps, positionerStyles, hidden, followCursorAxis, open, keepMounted],
    );

  const getArrowProps: UseTooltipPositionerReturnValue['getArrowProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        'aria-hidden': true,
        style: arrowStyles,
      });
    },
    [arrowStyles],
  );

  return React.useMemo(
    () => ({
      mounted,
      getPositionerProps,
      getArrowProps,
      arrowRef,
      arrowUncentered,
      side: renderedSide,
      alignment: renderedAlignment,
    }),
    [
      mounted,
      getPositionerProps,
      getArrowProps,
      arrowRef,
      arrowUncentered,
      renderedSide,
      renderedAlignment,
    ],
  );
}
