import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { InteractionType } from '../../utils/useEnhancedClickHandler';

export function usePopoverPopup(params: usePopoverPopup.Parameters): usePopoverPopup.ReturnValue {
  const { getProps, titleId, descriptionId, initialFocus } = params;

  const { popupRef, openMethod } = usePopoverRootContext();

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getProps(externalProps), {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      });
    },
    [getProps, titleId, descriptionId],
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
      getPopupProps,
      resolvedInitialFocus,
    }),
    [getPopupProps, resolvedInitialFocus],
  );
}

namespace usePopoverPopup {
  export interface Parameters {
    getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    titleId: string | undefined;
    descriptionId: string | undefined;
    initialFocus:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>)
      | undefined;
  }

  export interface ReturnValue {
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    resolvedInitialFocus: React.RefObject<HTMLElement | null> | 0;
  }
}
