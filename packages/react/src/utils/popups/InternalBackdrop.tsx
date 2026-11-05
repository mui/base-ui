import * as React from 'react';
import type { CutoutRect } from '../../internals/useAnchorPositioning';

/**
 * @internal
 */
export const InternalBackdrop = React.forwardRef(function InternalBackdrop(
  props: InternalBackdrop.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { cutout, ...otherProps } = props;

  let clipPath: string | undefined;
  if (cutout) {
    clipPath = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${cutout.left}px ${cutout.top}px,${cutout.left}px ${cutout.bottom}px,${cutout.right}px ${cutout.bottom}px,${cutout.right}px ${cutout.top}px,${cutout.left}px ${cutout.top}px)`;
  }

  return (
    <div
      ref={ref}
      role="presentation"
      // Ensures Floating UI's outside press detection runs, as it considers
      // it an element that existed when the popup rendered.
      data-base-ui-inert=""
      {...otherProps}
      style={{
        position: 'fixed',
        inset: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        clipPath,
        // Until the cutout is measured, let pointer events through rather than block the element
        // that should stay interactive.
        pointerEvents: cutout === null ? 'none' : undefined,
      }}
    />
  );
});

export interface InternalBackdropState {}

export interface InternalBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The viewport rect of the element to keep interactive, which is cut out of the backdrop.
   * `null` while it hasn't been measured yet. Omit it when nothing should be cut out.
   */
  cutout?: CutoutRect | null | undefined;
}

export namespace InternalBackdrop {
  export type State = InternalBackdropState;
  export type Props = InternalBackdropProps;
}
