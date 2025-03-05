import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useTooltipRootContext } from '../root/TooltipRootContext';

export function useTooltipPositioner(
  params: useTooltipPositioner.Parameters,
): useTooltipPositioner.ReturnValue {
  const { open, trackCursorAxis, mounted } = useTooltipRootContext();

  const positioning = useAnchorPositioning(params);

  const getPositionerProps: useTooltipPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps) => {
        const hiddenStyles: React.CSSProperties = {};

        if (!open) {
          hiddenStyles.pointerEvents = 'none';
        }

        if (trackCursorAxis === 'both') {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(
          {
            role: 'presentation',
            hidden: !mounted,
            style: {
              ...positioning.positionerStyles,
              ...hiddenStyles,
            },
          },
          externalProps,
        );
      },
      [open, trackCursorAxis, mounted, positioning.positionerStyles],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      ...positioning,
    }),
    [getPositionerProps, positioning],
  );
}

export namespace useTooltipPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {
    /**
     * Determines which axis the tooltip should track the cursor on.
     * @default 'none'
     */
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'top'
     */
    side?: Side;
  }

  export interface ReturnValue extends useAnchorPositioning.ReturnValue {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
