import * as React from 'react';
import './ExpandingBox.css';

export function ExpandingBox({
  isActive,
  className,
  children,
}: {
  isActive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <div className="expanding-box-head" data-active={Boolean(isActive)}>
        <div />
        <div />
        <div />
      </div>
      <div className="expanding-box-content" data-active={Boolean(isActive)}>
        <div />
        <div className={className}>
          {children}
          <div className="expanding-box-extra" />
        </div>
      </div>
      <div className="expanding-box-foot" data-active={Boolean(isActive)}>
        <div />
        <div />
        <div />
      </div>
    </React.Fragment>
  );
}
