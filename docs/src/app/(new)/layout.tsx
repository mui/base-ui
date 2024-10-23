import * as React from 'react';
import 'docs/src/styles.css';

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="relative z-0 px-[round(min(3rem,max(2rem,5vw)),1px)]">
      <span className="bg-color-gridline absolute left-0 right-0 top-12 -mt-px h-px" />
      <span className="bg-color-gridline absolute bottom-12 left-0 right-0 -mb-px h-px" />
      <div className="relative mx-auto flex min-h-dvh max-w-[1330px] flex-col py-12">
        <span className="bg-color-gridline absolute bottom-0 left-0 top-0 -ml-px w-px" />
        <span className="bg-color-gridline absolute bottom-0 right-0 top-0 -mr-px w-px" />
        <div className="bg-color-content flex grow flex-col">{children}</div>
      </div>
    </div>
  );
}
