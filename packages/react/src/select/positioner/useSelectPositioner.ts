import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { open, alignItemToTrigger, mounted, triggerElement, modal } = useSelectRootContext();

  useScrollLock((alignItemToTrigger || modal) && mounted, triggerElement);

  const positioning = useAnchorPositioning({
    ...params,
    trackAnchor: params.trackAnchor ?? !alignItemToTrigger,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (alignItemToTrigger ? { position: 'fixed' } : positioning.positionerStyles),
    [alignItemToTrigger, positioning.positionerStyles],
  );

  const getPositionerProps: useSelectPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (!open) {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          hidden: !mounted,
          style: {
            ...positionerStyles,
            ...hiddenStyles,
          },
        });
      },
      [open, mounted, positionerStyles],
    );

  return React.useMemo(
    () => ({
      ...positioning,
      side: alignItemToTrigger ? 'none' : positioning.side,
      getPositionerProps,
    }),
    [alignItemToTrigger, getPositionerProps, positioning],
  );
}

export namespace useSelectPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {}

  export interface ReturnValue extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    side: Side | 'none';
  }
}
