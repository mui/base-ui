import * as React from 'react';

/**
 * @internal
 */
const InternalBackdrop = React.forwardRef(function InternalBackdrop(
  props: InternalBackdrop.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { cutout, ...otherProps } = props;

  let clipPath: string | undefined;
  if (cutout) {
    const rect = cutout?.getBoundingClientRect();
    clipPath = `polygon(
      0% 0%,
      100% 0%,
      100% 100%,
      0% 100%,
      0% 0%,
      ${rect.left}px ${rect.top}px,
      ${rect.left}px ${rect.bottom}px,
      ${rect.right}px ${rect.bottom}px,
      ${rect.right}px ${rect.top}px,
      ${rect.left}px ${rect.top}px
    )`;
  }

  return (
    <div
      ref={ref}
      role="presentation"
      // Ensures Floating UI's outside press detection runs, as it considers
      // it an element that existed when the popup rendered.
      data-floating-ui-inert
      {...otherProps}
      style={{
        position: 'fixed',
        inset: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        clipPath,
      }}
    />
  );
});

export { InternalBackdrop };
