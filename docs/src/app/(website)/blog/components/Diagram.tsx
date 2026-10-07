import * as React from 'react';

import clsx from 'clsx';
import './Diagram.css';

interface DiagramProps extends React.ComponentProps<'div'> {
  minWidth: number;
}

export function Diagram({ minWidth, children, className, ...props }: DiagramProps) {
  return (
    <div {...props} className={clsx('DiagramBlogRoot', className)}>
      <div className="DiagramBlogContent" style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
