import * as React from 'react';

/**
 * @ignore - internal component.
 */
const InternalBackdrop = React.forwardRef(function InternalBackdrop(
  props: React.ComponentPropsWithoutRef<'div'>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
      }}
    />
  );
});

export { InternalBackdrop };
