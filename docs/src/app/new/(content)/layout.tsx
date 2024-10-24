import * as React from 'react';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="px-8 pb-24 pt-8">
      <div className="mx-auto max-w-[768px]">{children}</div>
    </div>
  );
}
