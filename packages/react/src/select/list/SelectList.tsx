'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useStore } from '@base-ui-components/utils/store';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { styleDisableScrollbar } from '../../utils/styles';
import { LIST_FUNCTIONAL_STYLES } from '../popup/utils';
import { selectors } from '../store';

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
  const { alignItemWithTriggerActive } = useSelectPositionerContext();

  const hasScrollArrows = useStore(store, selectors.hasScrollArrows);

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

  const setListElement = useEventCallback((element: HTMLElement | null) => {
    store.set('listElement', element);
  });

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, elementProps],
  });
});

export namespace SelectList {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
