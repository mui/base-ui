import * as React from 'react';

interface ResolveRenderedIdProps {
  id?: string | undefined;
  render?: unknown;
}

/**
 * Resolves an element's id using the same precedence as `useRenderElement`.
 * Render callbacks are opaque and are expected to use the id passed to them.
 *
 * @internal
 */
export function resolveRenderedId(props: ResolveRenderedIdProps, fallbackId: string | undefined) {
  if (React.isValidElement(props.render)) {
    const renderProps = props.render.props as { id?: string | undefined };
    if (Object.hasOwn(renderProps, 'id')) {
      return renderProps.id ?? '';
    }
  }

  return props.id ?? fallbackId;
}
