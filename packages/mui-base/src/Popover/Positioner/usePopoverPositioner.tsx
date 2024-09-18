'use client';
import * as React from 'react';
import type {
  UsePopoverPositionerParameters,
  UsePopoverPositionerReturnValue,
} from './usePopoverPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

export function usePopoverPositioner(
  params: UsePopoverPositionerParameters,
): UsePopoverPositionerReturnValue {
  const { open = false, keepMounted = false } = params;

  const {
    positionerStyles,
    arrowStyles,
    hidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlignment,
    positionerContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: UsePopoverPositionerReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if ((keepMounted && !open) || hidden) {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          style: {
            ...positionerStyles,
            ...hiddenStyles,
            zIndex: 2147483647, // max z-index
          },
        });
      },
      [positionerStyles, open, keepMounted, hidden],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      side: renderedSide,
      alignment: renderedAlignment,
      positionerContext,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlignment,
      positionerContext,
    ],
  );
}
