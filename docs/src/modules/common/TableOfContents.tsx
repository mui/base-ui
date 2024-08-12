import * as React from 'react';

export function TableOfContents() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        position: 'fixed',
        top: 49,
        right: 0,
        width: 240,
        height: 'calc(100% - 49px)',
        // borderLeft: "1px solid var(--gray-outline-1)",
        padding: '12px 24px',
        overflowY: 'auto',
      }}
    >
      <div className="d-f ai-center h-7 mb-2">
        <h4 className="Text size-3 weight-2">Contents</h4>
      </div>
      <nav>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            These
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            links
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            don&apos;t
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            work
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            just
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            yet
          </a>
        </div>
      </nav>
    </div>
  );
}
