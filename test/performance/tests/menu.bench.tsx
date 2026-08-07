import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { benchmark, ElementTiming } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';

const menuRows = createRows(300, 'Menu');
const multiTriggerMenuRows = createRows(100, 'Menu');
const menuTriggers = createRows(20, 'Menu trigger');
const menuItems = createRows(5, 'Menu item');
const smallMenuItems = createRows(10, 'Menu item');
const largeMenuItems = createRows(500, 'Menu item');
const firstOpenTimingNameRef = { current: 'menu-first-open' };
const subsequentOpenTimingNameRef = { current: 'menu-first-open' };

function waitForRemoval(element: Element) {
  if (!element.isConnected) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!element.isConnected) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

function waitForElement(selector: string) {
  const element = document.querySelector(selector);
  if (element) {
    return Promise.resolve(element);
  }

  return new Promise<Element>((resolve) => {
    const observer = new MutationObserver(() => {
      const nextElement = document.querySelector(selector);
      if (nextElement) {
        observer.disconnect();
        resolve(nextElement);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

function PhaseElementTiming({ timingNameRef }: { timingNameRef: { current: string } }) {
  return <ElementTiming name={timingNameRef.current} />;
}

function MenuMountList() {
  return (
    <MountList rows={menuRows}>
      {(row) => (
        <Menu.Root key={row.id}>
          <Menu.Trigger aria-label={`Open ${row.label}`}>{row.label}</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={8}>
              <Menu.Popup>
                {menuItems.map((item) => (
                  <Menu.Item key={item.id}>{item.label}</Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </MountList>
  );
}

function MultiTriggerMenuMountList() {
  return (
    <MountList rows={multiTriggerMenuRows}>
      {(row) => (
        <Menu.Root key={row.id}>
          {menuTriggers.map((trigger) => (
            <Menu.Trigger key={trigger.id}>{trigger.label}</Menu.Trigger>
          ))}
        </Menu.Root>
      )}
    </MountList>
  );
}

function SmallMenu({ timingNameRef }: { timingNameRef: { current: string } }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Open small menu benchmark">Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} positionMethod="fixed">
          <Menu.Popup>
            <div data-benchmark="small-menu-open-content">
              <PhaseElementTiming timingNameRef={timingNameRef} />
            </div>
            {smallMenuItems.map((item) => (
              <Menu.Item key={item.id}>{item.label}</Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function LargeMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Open menu benchmark">Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} positionMethod="fixed">
          <Menu.Popup>
            <div data-benchmark="menu-open-content">
              <ElementTiming name="menu-open" />
            </div>
            {largeMenuItems.map((item) => (
              <Menu.Item key={item.id}>{item.label}</Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

benchmark('Menu mount (300 instances)', () => <MenuMountList />);
benchmark('Menu mount (100 roots, 20 triggers each)', () => <MultiTriggerMenuMountList />);

benchmark(
  'Menu first open (10 items)',
  () => <SmallMenu timingNameRef={firstOpenTimingNameRef} />,
  async ({ waitForElementTiming }) => {
    const trigger = document.querySelector<HTMLElement>('[aria-label="Open small menu benchmark"]');

    if (trigger == null) {
      throw new Error('Missing small menu benchmark trigger');
    }

    trigger.click();
    await waitForElementTiming('menu-first-open');
  },
);

benchmark(
  'Menu subsequent open (10 items)',
  () => {
    subsequentOpenTimingNameRef.current = 'menu-first-open';
    return <SmallMenu timingNameRef={subsequentOpenTimingNameRef} />;
  },
  async ({ waitForElementTiming, resumeReactRecording }) => {
    const trigger = document.querySelector<HTMLElement>('[aria-label="Open small menu benchmark"]');

    if (trigger == null) {
      throw new Error('Missing small menu benchmark trigger');
    }

    trigger.click();
    await waitForElementTiming('menu-first-open');

    const popupContent = document.querySelector('[data-benchmark="small-menu-open-content"]');
    if (popupContent == null) {
      throw new Error('Missing small menu benchmark popup');
    }

    trigger.click();
    await waitForRemoval(popupContent);

    subsequentOpenTimingNameRef.current = 'menu-subsequent-open';
    resumeReactRecording();
    trigger.click();
    const nextPopupContent = await waitForElement('[data-benchmark="small-menu-open-content"]');
    const timingName = nextPopupContent
      .querySelector('[elementtiming]')
      ?.getAttribute('elementtiming');
    if (timingName !== 'menu-subsequent-open') {
      throw new Error(`Expected subsequent-open marker, found ${timingName}`);
    }
    await waitForElementTiming('menu-subsequent-open');
  },
  { reactRecordingPaused: true },
);

benchmark(
  'Menu open (500 items)',
  () => <LargeMenu />,
  async ({ waitForElementTiming }) => {
    const trigger = document.querySelector<HTMLElement>('[aria-label="Open menu benchmark"]');

    if (trigger == null) {
      throw new Error('Missing menu benchmark trigger');
    }

    trigger.click();
    await waitForElementTiming('menu-open');

    if (document.querySelector('[data-benchmark="menu-open-content"]') == null) {
      throw new Error('Menu benchmark popup did not open');
    }
  },
);
