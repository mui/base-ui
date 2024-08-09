import * as React from 'react';

export const Box = React.forwardRef<HTMLDivElement>(function Box({ ...props }, forwardedRef) {
  return <div ref={forwardedRef} className="Box" {...props} />;
});
