import * as React from 'react';

/**
 * @internal
 */
const InternalBackdrop = React.forwardRef(function InternalBackdrop(
  props: React.ComponentPropsWithoutRef<'div'>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      role="presentation"
      // Ensures Floating UI's outside press detection runs, as it considers
      // it an element that existed when the popup rendered.
      data-floating-ui-inert
      {...props}
      style={{
        position: 'fixed',
        inset: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  );
});

export { InternalBackdrop };
