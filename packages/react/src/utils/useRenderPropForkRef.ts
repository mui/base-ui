import * as React from 'react';
import type { BaseUIComponentProps } from './types';
import { useForkRef } from './useForkRef';
import { isReactVersionAtLeast } from './reactVersion';

/**
 * Merges the rendering element's `ref` in addition to the other `ref`s.
 */
export function useRenderPropForkRef<ElementType extends React.ElementType, State>(
  render: BaseUIComponentProps<ElementType, State>['render'],
  ...refs: Array<React.Ref<any>>
): React.RefCallback<any> | null {
  let childRef;
  if (typeof render !== 'function') {
    childRef = isReactVersionAtLeast(19) ? render.props.ref : render.ref;
  } else {
    childRef = null;
  }

  return useForkRef(childRef, ...refs);
}
