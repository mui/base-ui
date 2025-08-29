'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { styleDisableScrollbar } from '../../utils/styles';
import { LIST_FUNCTIONAL_STYLES } from '../popup/utils';

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectList = React.forwardRef(function SelectList(
  componentProps: SelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store, scrollHandlerRef } = useSelectRootContext();
  const { alignItemWithTriggerActive, hasScrollArrows } = useSelectPositionerContext();

  const defaultProps: HTMLProps = {
    role: 'presentation',
    onScroll(event) {
      scrollHandlerRef.current?.(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: LIST_FUNCTIONAL_STYLES,
    }),
    className: hasScrollArrows ? styleDisableScrollbar.className : undefined,
  };

  const setScrollList = useEventCallback((element: HTMLElement | null) => {
    store.set('scrollList', element);
  });

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setScrollList],
    props: [defaultProps, elementProps],
  });
});

export namespace SelectList {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
