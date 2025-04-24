import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { overlapAnchorMode } = params;
  const { open, mounted, triggerElement, modal } = useSelectRootContext();

  useScrollLock({
    enabled: (overlapAnchorMode || modal) && open,
    mounted,
    open,
    referenceElement: triggerElement,
  });

  const positioning = useAnchorPositioning({
    ...params,
    trackAnchor: params.trackAnchor ?? !overlapAnchorMode,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (overlapAnchorMode ? { position: 'fixed' } : positioning.positionerStyles),
    [overlapAnchorMode, positioning.positionerStyles],
  );

  const getPositionerProps: useSelectPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (!open) {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeProps<'div'>(
          {
            role: 'presentation',
            hidden: !mounted,
            style: {
              ...positionerStyles,
              ...hiddenStyles,
            },
          },
          externalProps,
        );
      },
      [open, mounted, positionerStyles],
    );

  return React.useMemo(
    () => ({
      ...positioning,
      side: overlapAnchorMode ? 'none' : positioning.side,
      getPositionerProps,
    }),
    [getPositionerProps, positioning, overlapAnchorMode],
  );
}

export namespace useSelectPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {
    overlapAnchorMode: boolean;
  }

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {
    /**
     * Determines how the positioner is anchored to the trigger.
     * - `'beside-trigger'`: Anchors beside the trigger.
     * - `'overlap-trigger'`: Anchors over the trigger, aligning the selected item with the trigger's value.
     * @default 'overlap-trigger'
     */
    anchorMode?: 'beside-trigger' | 'overlap-trigger';
  }

  export interface ReturnValue extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    side: Side | 'none';
  }
}
