import * as React from 'react';
import { useFloating, useInteractions, useDismiss } from '@floating-ui/react';
import { UseDialogPopupParameters, UseDialogPopupReturnValue } from './DialogPopup.types';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
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
    animated,
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
    isTopmost,
  } = parameters;

  const { refs, context } = useFloating({
    open,
    onOpenChange,
  });

  const popupRef = React.useRef<HTMLElement | null>(null);

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: isTopmost && (softClose === true || softClose === 'clickOutside'),
    escapeKey: softClose === true || softClose === 'escapeKey',
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idParam);
  const handleRef = useForkRef(ref, popupRef, refs.setFloating);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: popupRef,
    enabled: animated,
  });

  React.useEffect(() => {
    setPopupElementId(id);
    return () => {
      setPopupElementId(undefined);
    };
  }, [id, setPopupElementId]);

  const getRootProps = (externalProps: React.HTMLAttributes<any>) =>
    mergeReactProps(externalProps, {
      'aria-labelledby': titleElementId ?? undefined,
      'aria-describedby': descriptionElementId ?? undefined,
      'aria-hidden': !open || undefined,
      'aria-modal': open && modal ? true : undefined,
      role: type,
      tabIndex: -1,
      ...getFloatingProps(),
      id,
      ref: handleRef,
    });

  return {
    floatingContext: context,
    getRootProps,
    mounted,
    transitionStatus,
  };
}
