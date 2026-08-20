'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import * as React from 'react';
import { isVirtualClick } from '../../floating-ui-react/utils/event';
import { useButton } from '../../internals/use-button';
import type { BaseUIEvent } from '../../internals/types';
import { useTranslations } from '../../internals/localization-context/LocalizationContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import type { DraggableHandle } from './DraggableHandle';

/** Whether the rendered children contain text that can name the handle. */
function hasRenderedText(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (typeof child === 'string') {
      return child.trim() !== '';
    }
    if (typeof child === 'number') {
      return true;
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      const childProps = child.props as Record<string, unknown>;
      const ariaHidden = childProps['aria-hidden'];
      if (
        ariaHidden === true ||
        ariaHidden === 'true' ||
        childProps.hidden === true ||
        childProps.inert === true
      ) {
        return false;
      }
      return hasRenderedText(child.props.children);
    }
    return false;
  });
}

export function useDraggableHandle(
  componentProps: DraggableHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
  keyboardOnly: boolean,
) {
  const {
    className,
    render,
    style,
    nativeButton = true,
    disabled: disabledProp,
    onClick,
    ...elementProps
  } = componentProps;

  const { setHandleElement, setKeyboardHandleElement, startKeyboardDrag, label, disabled } =
    useDraggableRootContext();

  const partName = keyboardOnly ? 'Draggable.KeyboardHandle' : 'Draggable.Handle';
  if (process.env.NODE_ENV !== 'production' && disabledProp !== undefined) {
    warn(
      `Base UI: \`disabled\` was passed to ${partName}, which has no disabled state of its own. ` +
        'The engine reads `disabled` from Draggable.Root, so the handle would look disabled while the root stayed draggable. ' +
        'Set `disabled` on Draggable.Root instead.',
    );
  }

  const translations = useTranslations();
  const { getButtonProps, buttonRef } = useButton({ disabled, native: nativeButton });
  const state: DraggableHandle.State = { disabled };

  const handleRef = useRefWithInit(() => {
    const token = {};
    const setElement = keyboardOnly ? setKeyboardHandleElement : setHandleElement;
    return (node: HTMLElement | null) => setElement(node, token);
  }).current;

  const renderedChildren = React.isValidElement<{ children?: React.ReactNode }>(render)
    ? render.props.children
    : undefined;
  const hasTextChildren = hasRenderedText(elementProps.children ?? renderedChildren);
  const hasOpaqueRender =
    typeof render === 'function' ||
    (React.isValidElement(render) &&
      typeof render.type !== 'string' &&
      renderedChildren === undefined);
  const needsDefaultLabel =
    label !== undefined &&
    !hasTextChildren &&
    !hasOpaqueRender &&
    elementProps['aria-label'] === undefined &&
    elementProps['aria-labelledby'] === undefined;

  const handleClick = useStableCallback(
    (event: BaseUIEvent<React.MouseEvent<HTMLButtonElement>>) => {
      onClick?.(event);
      if (
        keyboardOnly &&
        !event.defaultPrevented &&
        isVirtualClick(event.nativeEvent) &&
        !disabled
      ) {
        startKeyboardDrag();
      }
    },
  );

  return useRenderElement('button', componentProps, {
    state,
    props: [
      needsDefaultLabel ? { 'aria-label': translations.dragHandleLabel({ label }) } : undefined,
      { ...elementProps, onClick: handleClick },
      getButtonProps,
    ],
    ref: [forwardedRef, buttonRef, handleRef],
  });
}
