import * as React from 'react';
import type { BaseUIComponentProps } from './types';
import { mergeProps } from './mergeProps';

export function evaluateRenderProp<ElementType extends React.ElementType, State>(
  render: BaseUIComponentProps<ElementType, State>['render'],
  props: React.HTMLAttributes<any> & React.RefAttributes<any>,
  state: State,
): React.ReactElement<Record<string, unknown>> {
  return typeof render === 'function'
    ? render(props, state)
    : React.cloneElement(render, { ...mergeProps(props, render.props), ref: props.ref });
}
