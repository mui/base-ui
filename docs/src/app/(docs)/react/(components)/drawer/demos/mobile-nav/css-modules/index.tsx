'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './index.module.css';

const ITEMS = [
  { href: '/react/quick-start', label: 'Overview' },
  { href: '/react', label: 'Components' },
  { href: '/react', label: 'Utilities' },
  { href: '/react/releases', label: 'Releases' },
] as const;

const LONG_LIST = [
  { href: '/react/accordion', label: 'Accordion' },
  { href: '/react/alert-dialog', label: 'Alert Dialog' },
  { href: '/react/autocomplete', label: 'Autocomplete' },
  { href: '/react/avatar', label: 'Avatar' },
  { href: '/react/button', label: 'Button' },
  { href: '/react/checkbox', label: 'Checkbox' },
  { href: '/react/checkbox-group', label: 'Checkbox Group' },
  { href: '/react/collapsible', label: 'Collapsible' },
  { href: '/react/combobox', label: 'Combobox' },
  { href: '/react/context-menu', label: 'Context Menu' },
  { href: '/react/dialog', label: 'Dialog' },
  { href: '/react/drawer', label: 'Drawer' },
  { href: '/react/field', label: 'Field' },
  { href: '/react/fieldset', label: 'Fieldset' },
  { href: '/react/form', label: 'Form' },
  { href: '/react/input', label: 'Input' },
  { href: '/react/menu', label: 'Menu' },
  { href: '/react/menubar', label: 'Menubar' },
  { href: '/react/meter', label: 'Meter' },
  { href: '/react/navigation-menu', label: 'Navigation Menu' },
  { href: '/react/number-field', label: 'Number Field' },
  { href: '/react/otp-field', label: 'OTP Field' },
  { href: '/react/popover', label: 'Popover' },
  { href: '/react/preview-card', label: 'Preview Card' },
  { href: '/react/progress', label: 'Progress' },
  { href: '/react/radio', label: 'Radio' },
  { href: '/react/scroll-area', label: 'Scroll Area' },
  { href: '/react/select', label: 'Select' },
  { href: '/react/separator', label: 'Separator' },
  { href: '/react/slider', label: 'Slider' },
  { href: '/react/switch', label: 'Switch' },
  { href: '/react/tabs', label: 'Tabs' },
  { href: '/react/toast', label: 'Toast' },
  { href: '/react/toggle', label: 'Toggle' },
  { href: '/react/toggle-group', label: 'Toggle Group' },
  { href: '/react/toolbar', label: 'Toolbar' },
  { href: '/react/tooltip', label: 'Tooltip' },
] as const;

export default function ExampleDrawerMobileNav() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open mobile menu</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.Viewport}>
          <ScrollArea.Root style={{ position: undefined }} className={styles.ScrollAreaRoot}>
            <ScrollArea.Viewport className={styles.ScrollAreaViewport}>
              <ScrollArea.Content className={styles.ScrollContent}>
                <Drawer.Popup className={styles.Popup}>
                  <nav aria-label="Navigation" className={styles.Panel}>
                    <div className={styles.Header}>
                      <div aria-hidden className={styles.HeaderSpacer} />
                      <div className={styles.Handle} />
                      <Drawer.Close aria-label="Close menu" className={styles.CloseButton}>
                        <XIcon />
                      </Drawer.Close>
                    </div>

                    <Drawer.Content className={styles.Content}>
                      <Drawer.Title className={styles.Title}>Menu</Drawer.Title>
                      <Drawer.Description className={styles.Description}>
                        Scroll the long list. Flick down from the top to dismiss.
                      </Drawer.Description>

                      <div className={styles.ScrollArea}>
                        <ul className={styles.List}>
                          {ITEMS.map((item) => (
                            <li key={item.label} className={styles.Item}>
                              <a className={styles.Link} href={item.href}>
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>

                        <ul className={styles.LongList} aria-label="Component links">
                          {LONG_LIST.map((item) => (
                            <li key={item.label} className={styles.Item}>
                              <a className={styles.Link} href={item.href}>
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Drawer.Content>
                  </nav>
                </Drawer.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={styles.Scrollbar}>
              <ScrollArea.Thumb className={styles.ScrollbarThumb} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 2.5 11 11m-11 0 11-11" />
    </svg>
  );
}
