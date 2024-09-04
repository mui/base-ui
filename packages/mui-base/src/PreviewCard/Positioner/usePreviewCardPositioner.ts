'use client';

import * as React from 'react';
import type {
  UsePreviewCardPositionerParameters,
  UsePreviewCardPositionerReturnValue,
} from './usePreviewCardPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

/**
 *
 * API:
 *
 * - [usePreviewCardPositioner API](https://mui.com/base-ui/api/use-preview-card-positioner/)
 */
export function usePreviewCardPositioner(
  params: UsePreviewCardPositionerParameters,
): UsePreviewCardPositionerReturnValue {
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

  const getPositionerProps: UsePreviewCardPositionerReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if ((keepMounted && !open) || hidden) {
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
