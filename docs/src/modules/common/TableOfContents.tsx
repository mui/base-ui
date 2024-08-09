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
            Introduction
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Installation
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Anatomy
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Provider
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Accessibility
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Placement
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Offset
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Delay
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Controlled
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Arrow
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Cursor Following
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Anchoring
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Styling
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            API Reference
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Provider
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Root
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Trigger
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Positioner
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Popup
          </a>
        </div>
        <div className="mb-3">
          <a href="#api" className="Text size-3 Link color-gray">
            Arrow
          </a>
        </div>
      </nav>
    </div>
  );
}
