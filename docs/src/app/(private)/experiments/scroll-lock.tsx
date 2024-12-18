'use client';
import * as React from 'react';
import { useScrollLock } from '../../../../../packages/react/src/utils/useScrollLock';

export default function ScrollLock() {
  const [enabled, setEnabled] = React.useState(false);
  const [bodyScrollY, setBodyScrollY] = React.useState(false);
  const [longContent, setLongContent] = React.useState(true);

  useScrollLock(enabled);

  React.useEffect(() => {
    document.body.style.overflowY = bodyScrollY ? 'scroll' : '';
  }, [bodyScrollY]);

  return (
    <div>
      <h1>useScrollLock</h1>
      <p>On macOS, enable `Show scroll bars: Always` in `Appearance` Settings.</p>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          background: 'lightgray',
          textAlign: 'right',
          padding: 5,
        }}
      >
        Fixed content should not shift
      </div>
      <div
        style={{
          position: 'fixed',
          top: 15,
          display: 'flex',
          gap: 10,
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(20px)',
          padding: 10,
        }}
      >
        <div>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            Scroll lock
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={bodyScrollY}
              onChange={(event) => setBodyScrollY(event.target.checked)}
            />
            body `overflow`
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={longContent}
              onChange={(event) => setLongContent(event.target.checked)}
            />
            Long content
          </label>
        </div>
      </div>
      {[...Array(longContent ? 100 : 10)].map((_, i) => (
        <p key={i}>Scroll locking text content</p>
      ))}
    </div>
  );
}
