import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { HTMLProps } from '../../utils/types';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

export function usePreviewCardPositioner(
  params: usePreviewCardPositioner.Parameters,
): usePreviewCardPositioner.ReturnValue {
  const { open, mounted } = usePreviewCardRootContext();

  const positioning = useAnchorPositioning(params);

  const getPositionerProps: usePreviewCardPositioner.ReturnValue['getPositionerProps'] =
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

export namespace usePreviewCardPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {}

  export interface ReturnValue extends useAnchorPositioning.ReturnValue {
    getPositionerProps: (externalProps?: HTMLProps) => HTMLProps;
  }
}
