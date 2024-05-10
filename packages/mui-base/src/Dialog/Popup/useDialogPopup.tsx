import * as React from 'react';
import { useFloating, useInteractions, useDismiss } from '@floating-ui/react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { UseDialogPopupParameters, UseDialogPopupReturnValue } from './DialogPopup.types';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { OpenState, useTransitionedElement } from '../../Transitions';
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
  const { id: idParam, ref, animated } = parameters;

  const {
    open,
    modal,
    titleElementId,
    descriptionElementId,
    setPopupElementId,
    type,
    onOpenChange,
    softClose,
  } = useDialogRootContext();

  const { refs, context } = useFloating({
    open,
    onOpenChange,
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: softClose === true || softClose === 'clickOutside',
    escapeKey: softClose === true || softClose === 'escapeKey',
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idParam);
  const handleRef = useForkRef(ref, refs.setFloating);

  const {
    getRootProps: getTransitionProps,
    openState,
    mounted,
  } = useTransitionedElement({ isRendered: open, enabled: animated });

  React.useEffect(() => {
    setPopupElementId(id ?? null);
    return () => {
      setPopupElementId(null);
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
    open, // determines if the popup was requested to open/close
    openState: openState as OpenState, // the actual current state
    mounted,
    getRootProps,
    floatingUIContext: context,
    modal,
  };
}
