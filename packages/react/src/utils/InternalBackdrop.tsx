import * as React from 'react';
import PropTypes from 'prop-types';

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
      {...props}
      style={{
        position: 'fixed',
        inset: 0,
      }}
    />
  );
});

InternalBackdrop.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
} as any;

export { InternalBackdrop };
