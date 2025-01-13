import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import styles from './menu-fluent-ui.module.css';

export default function ExampleMenu() {
  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        Reference:{' '}
        <a href="https://developer.microsoft.com/en-us/fluentui#/controls/web/contextualmenu">
          ContextualMenu with subemnus
        </a>{' '}
      </div>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>
          Contextual menu <ChevronDownIcon className={styles.ButtonIcon} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start" className={styles.Positioner}>
            <Menu.Popup className={styles.Popup}>
              {/* Submenu */}
              <Menu.Root>
                <Menu.SubmenuTrigger className={styles.ItemWithSubmenu}>
                  New{' '}
                  <span className={styles.SubmenuTrigger}>
                    <ChevronRightIcon />
                  </span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.Positioner}>
                    <Menu.Popup className={styles.Popup}>
                      <Menu.Item className={styles.Item}>Email message</Menu.Item>
                      <Menu.Item className={styles.Item}>Calendar event</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              {/* Submenu */}
              <Menu.Root>
                <Menu.SubmenuTrigger className={styles.ItemWithSubmenu}>
                  Share{' '}
                  <span className={styles.SubmenuTrigger}>
                    <ChevronRightIcon />
                  </span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.Positioner}>
                    <Menu.Popup className={styles.Popup}>
                      <Menu.Item className={styles.Item}>Share to Twitter</Menu.Item>
                      <Menu.Item className={styles.Item}>
                        Share to Facebook
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
              <Menu.Item className={styles.SplitButtonItem}>
                Share w/ split
              </Menu.Item>
              <Menu.Root>
                <Menu.SubmenuTrigger
                  className={styles.SplitButtonSubemnuTrigger}
                  aria-label="Open submenu"
                >
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.Positioner}>
                    <Menu.Popup className={styles.Popup}>
                      <Menu.Item className={styles.Item}>Share to Twitter</Menu.Item>
                      <Menu.Item className={styles.Item}>
                        Share to Facebook
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}
