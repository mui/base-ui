import * as React from 'react';
import { useFloating, useInteractions, useDismiss } from '@floating-ui/react';
import { UseDialogPopupParameters, UseDialogPopupReturnValue } from './DialogPopup.types';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useTransitionedElement } from '../../Transitions';
/**
 *
 * Demos:
 *
 * - [Dialog](https://mui.com/base-ui/react-dialog/#hooks)
 *
 * API:
 *
 * - [useDialogPopup API](https://mui.com/base-ui/react-dialog/hooks-api/#use-dialog-popup)
 */
export function useDialogPopup(parameters: UseDialogPopupParameters): UseDialogPopupReturnValue {
  const {
    descriptionElementId,
    id: idParam,
    modal,
    onOpenChange,
    open,
    ref,
    setPopupElementId,
    softClose,
    titleElementId,
    type,
  } = parameters;

  const { refs, context } = useFloating({
    open,
    onOpenChange,
  });

  const popupRef = React.useRef<HTMLElement | null>(null);

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: softClose === true || softClose === 'clickOutside',
    escapeKey: softClose === true || softClose === 'escapeKey',
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idParam);
  const handleRef = useForkRef(ref, popupRef, refs.setFloating);

  const { getRootProps: getTransitionProps, mounted } = useTransitionedElement({
    isRendered: open,
    elementRef: popupRef,
  });

  React.useEffect(() => {
    setPopupElementId(id);
    return () => {
      setPopupElementId(undefined);
    };
  }, [id, setPopupElementId]);

  const getRootProps = (otherProps: React.HTMLAttributes<any>) =>
    mergeReactProps(
      otherProps,
      getTransitionProps({
        'aria-labelledby': titleElementId ?? undefined,
        'aria-describedby': descriptionElementId ?? undefined,
        'aria-hidden': !open || undefined,
        'aria-modal': open && modal ? true : undefined,
        role: type,
        tabIndex: -1,
        ...getFloatingProps(),
        id,
        ref: handleRef,
      }),
    );

  return {
    floatingUIContext: context,
    getRootProps,
    mounted,
  };
}
