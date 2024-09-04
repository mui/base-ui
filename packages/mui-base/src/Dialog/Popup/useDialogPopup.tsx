'use client';

import * as React from 'react';
import { useFloating, useInteractions, useDismiss } from '@floating-ui/react';
import { UseDialogPopupParameters, UseDialogPopupReturnValue } from './DialogPopup.types';
import { useId } from '../../utils/useId';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
import { useScrollLock } from '../../utils/useScrollLock';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

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
    dismissible,
    titleElementId,
    isTopmost,
  } = parameters;

  const { refs, context } = useFloating({
    open,
    onOpenChange,
  });

  const popupRef = React.useRef<HTMLElement | null>(null);

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: isTopmost && dismissible,
    escapeKey: isTopmost,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const id = useId(idParam);
  const handleRef = useForkRef(ref, popupRef, refs.setFloating);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: popupRef,
    enabled: animated,
  });

  useScrollLock(modal && mounted);

  useEnhancedEffect(() => {
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
      role: 'dialog',
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
