import * as React from 'react';
import type { BaseUIComponentProps } from './types';
import { mergeReactProps } from './mergeReactProps';

export function evaluateRenderProp<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
  props: React.HTMLAttributes<any> & React.RefAttributes<any>,
  ownerState: OwnerState,
): React.ReactElement {
  return typeof render === 'function'
    ? render(props, ownerState)
    : React.cloneElement(render, mergeReactProps(render.props, props));
}
