import * as React from 'react';
import PropTypes from 'prop-types';

/**
 * @ignore - internal component.
 */
function InternalBackdrop(props: InternalBackdrop.Props) {
  const { inert = false } = props;
  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        // Allows `:hover` events immediately after `open` changes to `false`,
        // preventing a flicker when the cursor rests on the trigger. Flickers occur
        // because CSS `:hover` is temporarily blocked during an exit animation,
        // and `[data-popup-open]` is removed.
        // Keeping the backdrop in the DOM avoids `[data-floating-ui-inert]`, which
        // blocks outside clicks from closing the popup. This issue arises when
        // conditionally rendering the backdrop on `open` and using exit animations.
        // If the popup reopens before the exit animation finishes, the backdrop
        // receives this attribute, breaking outside click behavior.
        pointerEvents: inert ? 'none' : undefined,
      }}
    />
  );
}

namespace InternalBackdrop {
  export interface Props {
    /**
     * Whether the backdrop should be inert (not block pointer events).
     * @default false
     */
    inert?: boolean;
  }
}

InternalBackdrop.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether the backdrop should be inert (not block pointer events).
   * @default false
   */
  inert: PropTypes.bool,
} as any;

export { InternalBackdrop };
