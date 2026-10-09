import * as React from 'react';

import clsx from 'clsx';
import * as AffordedScroll from './AffordedScroll';
import './Diagram.css';

interface DiagramProps extends React.ComponentProps<'div'> {
  minWidth: number;
}

export function Diagram({ minWidth, children, className, ...props }: DiagramProps) {
  return (
    <AffordedScroll.Root {...props} className={clsx('BlogDiagram', className)}>
      <AffordedScroll.Viewport className="BlogDiagramViewport">
        <div className="BlogDiagramContent" style={{ minWidth }}>
          {children}
        </div>
      </AffordedScroll.Viewport>
    </AffordedScroll.Root>
  );
}
