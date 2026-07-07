import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from '../menu.module.css';
import { CaretDownIcon } from '../icons';

/**
 * Recreation of a devtools-overlay menu living inside a shadow root:
 * `Menu.Portal container={shadowRoot}` keeps the popup inside the overlay's
 * isolation boundary, and `modal={false}` keeps the host page interactive.
 * Recomposed from vercel/next.js dev-overlay `segment-boundary-trigger.tsx`
 * (MIT, code-ok, research/d-real-world-usage/menu/ranked.json #2).
 */
export function ShadowPortalExample() {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    // The overlay owns its shadow root's styles: clone the page stylesheets in
    // so the CSS Modules classes resolve inside the isolation boundary too.
    if (!root.hasChildNodes()) {
      host.ownerDocument
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((styleElement) => root.appendChild(styleElement.cloneNode(true)));
    }
    setShadowRoot(root);
  }, []);

  return (
    <div className={styles.Stack}>
      <Menu.Root modal={false}>
        <Menu.Trigger className={styles.Button}>
          Route segment <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal container={shadowRoot}>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Group>
                <Menu.GroupLabel className={styles.PlainGroupLabel}>
                  Toggle overrides
                </Menu.GroupLabel>
                <Menu.Item className={styles.Item}>Trigger loading boundary</Menu.Item>
                <Menu.Item className={styles.Item}>Trigger error boundary</Menu.Item>
                <Menu.Item className={styles.Item}>Trigger not-found</Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <div ref={hostRef} data-testid="shadow-host" className={styles.ShadowPanel}>
        shadow root host (popup portals in here)
      </div>
    </div>
  );
}
