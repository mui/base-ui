import type { BaseUIComponentProps } from './BaseUI.types';
import { useForkRef } from './useForkRef';

/**
 * Merges the rendering element's `ref` in addition to the other `ref`s.
 * @ignore - internal hook.
 */
export function useRenderPropForkRef<ElementType extends React.ElementType, OwnerState>(
  render: BaseUIComponentProps<ElementType, OwnerState>['render'],
  ...refs: Array<React.Ref<any>>
) {
  const childRef = typeof render !== 'function' ? render.ref : null;
  return useForkRef(childRef, ...refs);
}
