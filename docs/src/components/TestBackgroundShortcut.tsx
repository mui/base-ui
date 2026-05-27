import * as React from 'react';
import Script from 'next/script';

export function TestBackgroundShortcut() {
  return (
    <Script id="test-background-shortcut" strategy="afterInteractive">
      {`
        (() => {
          if (window.__baseUiTestBackgroundShortcut) {
            return;
          }

          window.__baseUiTestBackgroundShortcut = true;

          window.addEventListener(
            'keydown',
            (event) => {
              if (event.metaKey && event.code === 'KeyB') {
                event.preventDefault();

                const root = document.documentElement;
                const currentValue = root.style.getPropertyValue('--test-bg').trim();

                root.style.setProperty('--test-bg', currentValue === 'lightgreen' ? '' : 'lightgreen');
              }
            },
            { capture: true },
          );
        })();
      `}
    </Script>
  );
}
