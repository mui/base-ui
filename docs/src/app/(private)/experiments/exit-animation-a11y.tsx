'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Select } from '@base-ui/react/select';
import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { PreviewCard } from '@base-ui/react/preview-card';
import styles from './exit-animation-a11y.module.css';

const fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

/**
 * While a popup is kept mounted for its exit animation it is already logically closed, so it must
 * not stay reachable by assistive tech or the Tab key. Stretch the duration to inspect the closing
 * window: focus should already be back on the trigger, and the fading popup should be `inert`.
 *
 * See https://github.com/mui/base-ui/issues/5519.
 */
export default function ExitAnimationA11y() {
  const [duration, setDuration] = React.useState(300);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--exit-duration', `${duration}ms`);
    return () => {
      root.style.removeProperty('--exit-duration');
    };
  }, [duration]);

  return (
    <div className={styles.Root}>
      <div className={styles.Controls}>
        <label htmlFor="exit-duration">Exit animation: {duration}ms</label>
        <input
          id="exit-duration"
          type="range"
          min="0"
          max="10000"
          step="50"
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
        <span className={styles.Hint}>
          Docs demos use ~100ms. Raise it to inspect the closing window — several seconds is useful
          when driving a screen reader's virtual cursor.
        </span>
      </div>

      <div className={styles.Grid}>
        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Combobox — input inside the popup</h2>
          <p className={styles.CaseText}>
            On close, focus returns to the trigger instead of staying in the fading popup. Typing
            during the exit animation no longer reopens it; arrow keys still do.
          </p>
          <Combobox.Root items={fruits}>
            <Combobox.Trigger className={styles.Button}>Choose a fruit</Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className={styles.Popup}>
                  <Combobox.Input
                    className={styles.Input}
                    placeholder="Search"
                    aria-label="Search fruits"
                  />
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} className={styles.Item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Combobox — input outside the popup</h2>
          <p className={styles.CaseText}>
            Unchanged: focus never enters the popup, so typing during the exit animation still
            reopens and filters.
          </p>
          <Combobox.Root items={fruits}>
            <Combobox.Input
              className={styles.Input}
              placeholder="Search fruits"
              aria-label="Fruits"
            />
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <Combobox.Popup className={styles.Popup}>
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} className={styles.Item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Select</h2>
          <p className={styles.CaseText}>
            Pick an option, then press Tab immediately — focus order continues from the trigger.
          </p>
          <Select.Root>
            <Select.Trigger className={styles.Button} aria-label="Fruit">
              <Select.Value>{(value: string) => value || 'Pick one'}</Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={4}>
                <Select.Popup className={styles.Popup}>
                  {fruits.map((item) => (
                    <Select.Item key={item} value={item} className={styles.Item}>
                      <Select.ItemText>{item}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button type="button" className={styles.Button}>
            Tab target after the Select
          </button>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Popover</h2>
          <p className={styles.CaseText}>
            Press Escape while focus is inside — it returns to the trigger before the animation
            finishes.
          </p>
          <Popover.Root>
            <Popover.Trigger className={styles.Button}>Open popover</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner sideOffset={4}>
                <Popover.Popup className={styles.Popup}>
                  <Popover.Title>Popover</Popover.Title>
                  <button type="button" className={styles.Button}>
                    Inside button
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Menu</h2>
          <p className={styles.CaseText}>Choose an item or press Escape, then Tab straight away.</p>
          <Menu.Root>
            <Menu.Trigger className={styles.Button}>Open menu</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={4}>
                <Menu.Popup className={styles.Popup}>
                  <Menu.Item className={styles.Item}>Cut</Menu.Item>
                  <Menu.Item className={styles.Item}>Copy</Menu.Item>
                  <Menu.Item className={styles.Item}>Paste</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Dialog</h2>
          <p className={styles.CaseText}>
            The dialog has no positioner, so the popup itself carries `inert` while it animates out.
          </p>
          <Dialog.Root>
            <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className={styles.Backdrop} />
              <Dialog.Popup className={`${styles.Popup} ${styles.DialogPopup}`}>
                <Dialog.Title>Dialog</Dialog.Title>
                <div className={styles.Row}>
                  <input
                    className={styles.Input}
                    aria-label="Focusable field"
                    placeholder="Focusable field"
                  />
                  <Dialog.Close className={styles.Button}>Close</Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Navigation menu</h2>
          <p className={styles.CaseText}>
            Has no focus manager of its own. Tab to a link, press Escape, and check where focus sits
            while the popup animates out.
          </p>
          <NavigationMenu.Root>
            <NavigationMenu.List className={styles.Row}>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={styles.Button}>Products</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <NavigationMenu.Link href="#one" data-testid="nav-link-one">
                    First link
                  </NavigationMenu.Link>{' '}
                  <NavigationMenu.Link href="#two">Second link</NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner sideOffset={4}>
                <NavigationMenu.Popup className={styles.Popup}>
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Preview card</h2>
          <p className={styles.CaseText}>
            Also has no focus manager, so it is left as-is while closing for the same reason.
          </p>
          <PreviewCard.Root>
            <PreviewCard.Trigger className={styles.Button} href="#preview">
              Hover me
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner sideOffset={4}>
                <PreviewCard.Popup className={styles.Popup}>
                  <a href="#inside" data-testid="preview-link">
                    Link inside
                  </a>
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>

        <div className={styles.Case}>
          <h2 className={styles.CaseTitle}>Tooltip — regression check</h2>
          <p className={styles.CaseText}>
            An open tooltip that isn&apos;t hoverable must stay in the accessibility tree, so
            `trackCursorAxis` must not escalate to `inert`.
          </p>
          <Tooltip.Root trackCursorAxis="both">
            <Tooltip.Trigger className={styles.Button}>Hover me</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className={styles.Popup}>Still announced</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>
    </div>
  );
}
