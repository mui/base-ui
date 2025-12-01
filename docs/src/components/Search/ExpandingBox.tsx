import * as React from 'react';
import './ExpandingBox.css';

export function ExpandingBox({
  isActive,
  isCollapsed,
  className,
  children,
}: {
  isActive?: boolean;
  isCollapsed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <div
        className="expanding-box-head"
        data-active={Boolean(isActive)}
        data-collapsed={Boolean(isCollapsed)}
      >
        <div />
        <div />
        <div />
      </div>
      <div
        className="expanding-box-content"
        data-active={Boolean(isActive)}
        data-collapsed={Boolean(isCollapsed)}
      >
        <div />
        <div className={className}>
          {children}
          <div className="expanding-box-extra" />
        </div>
      </div>
      <div
        className="expanding-box-foot"
        data-active={Boolean(isActive)}
        data-collapsed={Boolean(isCollapsed)}
      >
        <div />
        <div />
        <div />
      </div>
    </React.Fragment>
  );
}
