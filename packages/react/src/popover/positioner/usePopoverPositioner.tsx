import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';

export function usePopoverPositioner(
  params: usePopoverPositioner.Parameters,
): usePopoverPositioner.ReturnValue {
  const { open, mounted } = usePopoverRootContext();

  const positioning = useAnchorPositioning(params);

  const getPositionerProps: usePopoverPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (!open) {
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
      [open, mounted, positioning.positionerStyles],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      ...positioning,
    }),
    [getPositionerProps, positioning],
  );
}

export namespace usePopoverPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {}

  export interface ReturnValue extends useAnchorPositioning.ReturnValue {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
