import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { anchor, usingItemAnchor } = params;
  const { open, mounted, triggerElement, modal } = useSelectRootContext();

  useScrollLock({
    enabled: (usingItemAnchor || modal) && open,
    mounted,
    open,
    referenceElement: triggerElement,
  });

  let anchorValue = anchor;
  if (anchorValue === 'trigger') {
    anchorValue = triggerElement;
  } else if (anchorValue === 'item') {
    anchorValue = null;
  }

  const positioning = useAnchorPositioning({
    ...params,
    anchor: anchorValue,
    trackAnchor: params.trackAnchor ?? !usingItemAnchor,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (usingItemAnchor ? { position: 'fixed' } : positioning.positionerStyles),
    [usingItemAnchor, positioning.positionerStyles],
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
      side: usingItemAnchor ? 'none' : positioning.side,
      getPositionerProps,
    }),
    [getPositionerProps, positioning, usingItemAnchor],
  );
}

export namespace useSelectPositioner {
  export interface Parameters extends Omit<useAnchorPositioning.Parameters, 'anchor'> {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned over the top of the trigger so that
     * the selected item's text is aligned with the trigger's value text.
     */
    anchor?: 'item' | 'trigger' | useAnchorPositioning.Parameters['anchor'];
    usingItemAnchor: boolean;
  }

  export interface SharedParameters extends Omit<useAnchorPositioning.SharedParameters, 'anchor'> {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned over the top of the trigger so that
     * the selected item's text is aligned with the trigger's value text.
     */
    anchor?: 'item' | 'trigger' | useAnchorPositioning.Parameters['anchor'];
  }

  export interface ReturnValue extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    side: Side | 'none';
  }
}
