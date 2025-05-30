import c from 'clsx';
import * as React from 'react';

/** @internal */
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button(props, ref) {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      {...props}
      ref={ref}
      className={c(
        props.className,
        'bg-slate-200/90 hover:bg-slate-200/50 data-[open]:bg-slate-200/50 rounded p-2 px-3 transition-colors',
      )}
    />
  );
});
