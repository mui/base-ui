import * as React from 'react';
import type { BaseUIComponentProps } from './types.js';
import { mergeReactProps } from './mergeReactProps.js';

export function evaluateRenderProp<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
  props: React.HTMLAttributes<any> & React.RefAttributes<any>,
  ownerState: OwnerState,
): React.ReactElement<Record<string, unknown>> {
  return typeof render === 'function'
    ? render(props, ownerState)
    : React.cloneElement(render, { ...mergeReactProps(render.props, props), ref: props.ref });
}
