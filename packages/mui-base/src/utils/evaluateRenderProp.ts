import * as React from 'react';
import type { BaseUIComponentProps } from './BaseUI.types';
import { mergeReactProps } from './mergeReactProps';

export function evaluateRenderProp<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
  props: React.HTMLAttributes<any>,
  ownerState: OwnerState,
) {
  return typeof render === 'function'
    ? render(props, ownerState)
    : React.cloneElement(render, mergeReactProps(render.props, props));
}
