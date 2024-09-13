'use client';

import * as React from 'react';
import { useScrollLock } from '../../../packages/mui-base/src/utils/useScrollLock';

export default function ScrollLock() {
  const [enabled, setEnabled] = React.useState(false);
  const [bodyScrollY, setBodyScrollY] = React.useState(false);
  const [longContent, setLongContent] = React.useState(true);

  useScrollLock(enabled);

  React.useEffect(() => {
    document.body.style.overflowY = bodyScrollY ? 'auto' : '';
  }, [bodyScrollY]);

  return (
    <div>
      <h2>Enable Show scroll bar: Always</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <div>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Scroll lock
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={bodyScrollY}
              onChange={(e) => setBodyScrollY(e.target.checked)}
            />
            body `overflow`
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={longContent}
              onChange={(e) => setLongContent(e.target.checked)}
            />
            Long content
          </label>
        </div>
      </div>
      {[...Array(longContent ? 100 : 10)].map(() => (
        <p>Scroll locking text content</p>
      ))}
    </div>
  );
}
