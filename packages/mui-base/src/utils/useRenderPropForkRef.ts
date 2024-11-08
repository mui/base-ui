import * as React from 'react';
import type { BaseUIComponentProps } from './types.js';
import { useForkRef } from './useForkRef.js';
import { isReactVersionAtLeast } from './reactVersion.js';

/**
 * Merges the rendering element's `ref` in addition to the other `ref`s.
 * @ignore - internal hook.
 */
export function useRenderPropForkRef<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
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
