'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './menu.module.css';

type View = 'main' | 'more';

export default function Experiment() {
  const [view, setView] = React.useState<View>('main');

  return (
    <div className={styles.Container}>
      <Menu.Root
        onOpenChangeComplete={(open) => {
          if (!open) {
            setView('main');
          }
        }}
      >
        <Menu.Trigger className={styles.Button}>Options</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} className={styles.Positioner}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Viewport
                className={styles.Viewport}
                transitionKey={view}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft' && view === 'more') {
                    setView('main');
                  }
                }}
              >
                {view === 'main' ? (
                  <div className={styles.List}>
                    <Menu.Item className={styles.Item}>New window</Menu.Item>
                    <Menu.Item className={styles.Item}>Open file</Menu.Item>
                    <Menu.Separator className={styles.Separator} />
                    <Menu.Item
                      className={styles.Item}
                      closeOnClick={false}
                      onClick={() => setView('more')}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowRight') {
                          setView('more');
                        }
                      }}
                    >
                      More tools
                      <CaretRightIcon className={styles.Caret} />
                    </Menu.Item>
                  </div>
                ) : (
                  <div className={styles.List}>
                    <Menu.Item
                      className={styles.Item}
                      closeOnClick={false}
                      onClick={() => setView('main')}
                    >
                      <CaretLeftIcon className={styles.Caret} />
                      Back
                    </Menu.Item>
                    <Menu.Separator className={styles.Separator} />
                    <Menu.Item className={styles.Item}>Developer tools</Menu.Item>
                    <Menu.Item className={styles.Item}>Task manager</Menu.Item>
                    <Menu.Item className={styles.Item}>Clear browsing data</Menu.Item>
                    <Menu.Item className={styles.Item}>Extensions</Menu.Item>
                  </div>
                )}
              </Menu.Viewport>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

function CaretLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M10 4v8L5.5 8z" />
    </svg>
  );
}
