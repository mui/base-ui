import * as React from 'react';
import type { BaseUIComponentProps } from './types';
import { useForkRef } from './useForkRef';
import { isReactVersionAtLeast } from './reactVersion';

/**
 * Merges the rendering element's `ref` in addition to the other `ref`s.
 * @ignore - internal hook.
 */
export function useRenderPropForkRef<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
  ...refs: Array<React.Ref<any>>
): React.RefCallback<any> | null {
  let childRef;
  if (isReactVersionAtLeast(19)) {
    childRef = typeof render !== 'function' ? render.props.ref : null;
  } else {
    childRef = typeof render !== 'function' ? render.ref : null;
  }

  return useForkRef(childRef, ...refs);
}
