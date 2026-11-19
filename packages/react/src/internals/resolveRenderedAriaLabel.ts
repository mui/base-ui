import * as React from 'react';
import { unwrapLazyRenderProp } from './useRenderElement';

interface ResolveRenderedAriaLabelProps {
  'aria-label'?: string | undefined;
  render?: unknown;
}

/**
 * Resolves an element's `aria-label` using the same precedence as `useRenderElement`, where a
 * render element's own props win over the component's. Render callbacks are opaque and are
 * expected to keep the `aria-labelledby` passed to them in sync with any `aria-label` they add.
 *
 * @internal
 */
export function resolveRenderedAriaLabel(props: ResolveRenderedAriaLabelProps) {
  const render = unwrapLazyRenderProp(props.render);
  if (React.isValidElement(render)) {
    const renderProps = render.props as { 'aria-label'?: string | undefined };
    if (Object.hasOwn(renderProps, 'aria-label')) {
      return renderProps['aria-label'];
    }
  }

  return props['aria-label'];
}
