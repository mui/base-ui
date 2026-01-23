'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { selectors } from '../store';

/**
 * An icon that indicates that the trigger button opens a select popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectIcon = React.forwardRef(function SelectIcon(
  componentProps: SelectIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useSelectRootContext();
  const open = useStore(store, selectors.open);

  const state: SelectIcon.State = {
    open,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ 'aria-hidden': true, children: '▼' }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
});

export interface SelectIconState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
}

export interface SelectIconProps extends BaseUIComponentProps<'span', SelectIcon.State> {}

export namespace SelectIcon {
  export type State = SelectIconState;
  export type Props = SelectIconProps;
}
