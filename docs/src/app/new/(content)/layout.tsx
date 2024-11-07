import * as React from 'react';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="px-8 pt-12 pb-20">
      <div className="relative mx-auto max-w-[768px]">{children}</div>
    </div>
  );
}
