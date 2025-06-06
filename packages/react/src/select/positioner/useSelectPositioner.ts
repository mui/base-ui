import * as React from 'react';
import type { HTMLProps } from '../../utils/types';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { store } = useSelectRootContext();

  const open = useSelector(store, selectors.open);
  const mounted = useSelector(store, selectors.mounted);
  const modal = useSelector(store, selectors.modal);
  const triggerElement = useSelector(store, selectors.triggerElement);
  const alignItemWithTriggerActive = useSelector(store, selectors.alignItemWithTriggerActive);

  useScrollLock({
    enabled: (alignItemWithTriggerActive || modal) && open,
    mounted,
    open,
    referenceElement: triggerElement,
  });

  const positioning = useAnchorPositioning({
    ...params,
    trackAnchor: params.trackAnchor ?? !alignItemWithTriggerActive,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (alignItemWithTriggerActive ? { position: 'fixed' } : positioning.positionerStyles),
    [alignItemWithTriggerActive, positioning.positionerStyles],
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
      side: alignItemWithTriggerActive ? 'none' : positioning.side,
      getPositionerProps,
    }),
    [getPositionerProps, positioning, alignItemWithTriggerActive],
  );
}

export namespace useSelectPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {
    /**
     * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
     * @default true
     */
    alignItemWithTrigger?: boolean;
  }

  export interface ReturnValue extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
    getPositionerProps: (externalProps?: HTMLProps) => HTMLProps;
    side: Side | 'none';
  }
}
