import * as React from 'react';
import { isReactVersionAtLeast } from './reactVersion';

// Compatibility shim that ensures stable props object for forwardRef components
// Fixes https://github.com/react/react/issues/31613
// We ensure that the ref is always present in the props object (even if that's not the case for older versions of React) to avoid the footgun of spreading props over the ref in the newer versions of React.
// Footgun: <Component ref={ref} {...props} /> will break past React 19, but the types will now warn us that we should use <Component {...props} ref={ref} /> instead.
export const forwardRef = <T, P = {}>(
  render: React.ForwardRefRenderFunction<T, P & { ref: React.Ref<T> }>,
) => {
  if (isReactVersionAtLeast(19)) {
    const Component = (props: any) => render(props, props.ref ?? null);
    Component.displayName = render.displayName ?? render.name;
    return Component as React.ForwardRefExoticComponent<P>;
  }
  return React.forwardRef(render as React.ForwardRefRenderFunction<T, React.PropsWithoutRef<P>>);
};
