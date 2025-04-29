import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { alignItemWithTriggerMode } = params;
  const { open, mounted, triggerElement, modal } = useSelectRootContext();

  useScrollLock({
    enabled: (alignItemWithTriggerMode || modal) && open,
    mounted,
    open,
    referenceElement: triggerElement,
  });

  const positioning = useAnchorPositioning({
    ...params,
    trackAnchor: params.trackAnchor ?? !alignItemWithTriggerMode,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (alignItemWithTriggerMode ? { position: 'fixed' } : positioning.positionerStyles),
    [alignItemWithTriggerMode, positioning.positionerStyles],
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
      side: alignItemWithTriggerMode ? 'none' : positioning.side,
      getPositionerProps,
    }),
    [getPositionerProps, positioning, alignItemWithTriggerMode],
  );
}

export namespace useSelectPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {
    alignItemWithTriggerMode: boolean;
  }

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {
    /**
     * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
     * @default true
     */
    alignItemWithTrigger?: boolean;
  }

  export interface ReturnValue extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    side: Side | 'none';
  }
}
