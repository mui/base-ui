import * as React from 'react';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { HTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';

export function usePopoverPositioner(
  params: usePopoverPositioner.Parameters,
): usePopoverPositioner.ReturnValue {
  const { open, mounted } = usePopoverRootContext();

  const positioning = useAnchorPositioning(params);

  const props = React.useMemo<HTMLProps>(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
      hiddenStyles.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style: {
        ...positioning.positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [open, mounted, positioning.positionerStyles]);

  return React.useMemo(
    () => ({
      props,
      ...positioning,
    }),
    [props, positioning],
  );
}

export namespace usePopoverPositioner {
  export interface Parameters extends useAnchorPositioning.Parameters {}

  export interface SharedParameters extends useAnchorPositioning.SharedParameters {}

  export interface ReturnValue extends useAnchorPositioning.ReturnValue {
    props: HTMLProps;
  }
}
