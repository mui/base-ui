import * as React from 'react';
import type { HTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { InteractionType } from '../../utils/useEnhancedClickHandler';

export function usePopoverPopup(params: usePopoverPopup.Parameters): usePopoverPopup.ReturnValue {
  const { titleId, descriptionId, initialFocus } = params;

  const { popupRef, openMethod } = usePopoverRootContext();

  const props = React.useMemo<HTMLProps>(
    () => ({
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
    }),
    [titleId, descriptionId],
  );

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = React.useCallback(
    (interactionType: InteractionType) => {
      if (interactionType === 'touch') {
        return popupRef;
      }

      return 0;
    },
    [popupRef],
  );

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      return defaultInitialFocus(openMethod ?? '');
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [defaultInitialFocus, initialFocus, openMethod]);

  return React.useMemo(
    () => ({
      props,
      resolvedInitialFocus,
    }),
    [props, resolvedInitialFocus],
  );
}

export namespace usePopoverPopup {
  export interface Parameters {
    titleId: string | undefined;
    descriptionId: string | undefined;
    initialFocus:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>)
      | undefined;
  }

  export interface ReturnValue {
    props: HTMLProps;
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | 0;
  }
}
