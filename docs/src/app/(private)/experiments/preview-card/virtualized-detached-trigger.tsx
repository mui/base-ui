'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';

const handle = PreviewCard.createHandle();
const ITEMS = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
const ITEM_HEIGHT = 48;
const VIEWPORT_HEIGHT = 320;
const BUFFER = 2;

export default function VirtualizedDetachedTriggerExperiment() {
  const [scrollTop, setScrollTop] = React.useState(0);
  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + BUFFER * 2;
  const end = Math.min(ITEMS.length, start + visibleCount);
  const visible = ITEMS.slice(start, end);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>PreviewCard — detached trigger virtualization bug</h2>
      <ol style={{ lineHeight: 1.6, paddingLeft: 20 }}>
        <li>Hover an item near the bottom of the visible window to open the preview card.</li>
        <li>Without moving the cursor off the popup, scroll the list until the hovered item leaves the viewport (gets virtualized out).</li>
        <li>
          <strong>Before the fix:</strong> the popup jumps to <code>(0, 0)</code> in the top-left of the viewport.
          <br />
          <strong>After the fix:</strong> the popup closes cleanly.
        </li>
      </ol>

      <div
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{
          width: 320,
          height: VIEWPORT_HEIGHT,
          overflowY: 'auto',
          border: '1px solid #d4d4d4',
          borderRadius: 6,
          margin: '20px 0',
        }}
      >
        <div style={{ height: ITEMS.length * ITEM_HEIGHT, position: 'relative' }}>
          {visible.map((label, i) => {
            const index = start + i;
            return (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  top: index * ITEM_HEIGHT,
                  height: ITEM_HEIGHT,
                  width: '100%',
                  borderBottom: '1px solid #efefef',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  boxSizing: 'border-box',
                }}
              >
                <PreviewCard.Trigger
                  href="#"
                  handle={handle}
                  delay={0}
                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                >
                  {label}
                </PreviewCard.Trigger>
              </div>
            );
          })}
        </div>
      </div>

      <PreviewCard.Root handle={handle}>
        <PreviewCard.Portal>
          <PreviewCard.Positioner sideOffset={8}>
            <PreviewCard.Popup
              style={{
                background: 'white',
                border: '1px solid #d4d4d4',
                borderRadius: 6,
                padding: '12px 16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                width: 220,
                fontSize: 14,
                color: '#171717',
              }}
            >
              Preview card content
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </div>
  );
}
