import * as React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ignoreActWarnings, waitFor } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { Popover } from '@base-ui/react/popover';
import { Select } from '@base-ui/react/select';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';

/**
 * Keyboard focus scenarios across popups: each one presses real keys (or clicks and hovers) and
 * checks, after every step, which element has focus and which popups are open. Native Tab is
 * needed, as the focus guards rely on the browser's sequential focus navigation.
 */

type Action =
  'Tab' | 'Shift+Tab' | 'Enter' | 'Escape' | 'ArrowDown' | `click ${string}` | `hover ${string}`;

interface Step {
  /** A key to press, or a labeled element to click or hover. */
  action: Action;
  /** The labeled element that should have focus afterwards. */
  focus: string;
  /** The scenario's popups that should be open afterwards. The others must be closed. */
  open?: string[];
  /** Why the step expects this. */
  note?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  popups: string[];
  steps: Step[];
  Demo: React.ComponentType;
}

function useLabels() {
  return {
    label: (name: string) => ({ 'data-label': name }),
    popup: (name: string) => ({ 'data-popup': name, 'data-label': `${name} popup` }),
  };
}

function Button(props: { name: string; onClick?: () => void; ref?: React.Ref<HTMLButtonElement> }) {
  const { label } = useLabels();
  return (
    <button ref={props.ref} type="button" onClick={props.onClick} {...label(props.name)}>
      {props.name}
    </button>
  );
}

function Items(props: { names: string[] }) {
  return props.names.map((name) => <Button key={name} name={name} />);
}

const fruits = ['Apple', 'Banana', 'Cherry'];

/* Building blocks */

function BasicPopover(
  props: Partial<Pick<Popover.Root.Props, 'open' | 'onOpenChange' | 'modal'>> & {
    name?: string;
    triggerName?: string;
    openOnHover?: boolean;
    keepMounted?: boolean;
    container?: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
  },
) {
  const {
    name = 'Popover',
    triggerName = 'Trigger',
    openOnHover,
    keepMounted,
    container,
    children,
    ...rootProps
  } = props;
  const { label, popup } = useLabels();
  return (
    <Popover.Root {...rootProps}>
      <Popover.Trigger openOnHover={openOnHover} delay={0} closeDelay={0} {...label(triggerName)}>
        {triggerName}
      </Popover.Trigger>
      <Popover.Portal keepMounted={keepMounted} container={container}>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup {...popup(name)}>{children}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function BasicMenu(props: { name?: string; triggerName?: string; openOnHover?: boolean }) {
  const { name = 'Menu', triggerName = 'Trigger', openOnHover } = props;
  const { label, popup } = useLabels();
  return (
    <Menu.Root>
      <Menu.Trigger openOnHover={openOnHover} delay={0} closeDelay={0} {...label(triggerName)}>
        {triggerName}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup {...popup(name)}>
            {['Item 1', 'Item 2'].map((item) => (
              <Menu.Item key={item} {...label(item)}>
                {item}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function BasicCombobox(props: { name?: string }) {
  const { name = 'Combobox' } = props;
  const { label, popup } = useLabels();
  return (
    <Combobox.Root items={fruits}>
      <Combobox.InputGroup>
        <Combobox.Input placeholder="Input" {...label('Input')} />
        <Combobox.Trigger aria-label="Open popup">▾</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={8}>
          <Combobox.Popup {...popup(name)}>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item} {...label(item)}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function BasicDialog(
  props: Partial<Pick<Dialog.Root.Props, 'modal' | 'disablePointerDismissal'>> & {
    triggerName?: string;
    children?: React.ReactNode;
  },
) {
  const { triggerName = 'Trigger', children, ...rootProps } = props;
  const { label, popup } = useLabels();
  return (
    <Dialog.Root {...rootProps}>
      <Dialog.Trigger {...label(triggerName)}>{triggerName}</Dialog.Trigger>
      <Dialog.Portal>
        {rootProps.modal !== false && <Dialog.Backdrop />}
        <Dialog.Popup {...popup('Dialog')}>
          <Dialog.Title>Dialog</Dialog.Title>
          {children ?? (
            <React.Fragment>
              <Button name="Item 1" />
              <Dialog.Close {...label('Close')}>Close</Dialog.Close>
            </React.Fragment>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row(props: { children: React.ReactNode }) {
  return (
    <div>
      <Button name="Before" />
      {props.children}
      <Button name="After" />
    </div>
  );
}

/* Scenarios */

const scenarios: Scenario[] = [
  {
    id: 'popover-hover',
    title: 'Popover opened on hover',
    description:
      'Opening on hover leaves focus where it was. Hover the trigger, then keep the pointer still.',
    popups: ['Popover'],
    Demo() {
      return (
        <Row>
          <BasicPopover openOnHover>
            <Button name="Item 1" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'hover Trigger', focus: 'Before', open: ['Popover'] },
      {
        action: 'Tab',
        focus: 'Trigger',
        open: ['Popover'],
        note: 'Tab reaches the trigger and keeps the popover open.',
      },
      {
        action: 'Tab',
        focus: 'After',
        note: 'Tab from the trigger leaves past the popover and closes it.',
      },
      { action: 'Shift+Tab', focus: 'Trigger' },
    ],
  },
  {
    id: 'popover-hover-focused-trigger',
    title: 'Popover opened on hover while its trigger has focus',
    description: 'Tab from the trigger of a popover that took no focus.',
    popups: ['Popover'],
    Demo() {
      return (
        <Row>
          <BasicPopover openOnHover>
            <Button name="Item 1" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'hover Trigger', focus: 'Trigger', open: ['Popover'] },
      {
        action: 'Tab',
        focus: 'After',
        note: 'Tab leaves past the popover and closes it, instead of stopping on a hidden guard.',
      },
      { action: 'Shift+Tab', focus: 'Trigger' },
    ],
  },
  {
    id: 'popover-refused',
    title: 'Popover that refuses focus-out closes',
    description:
      'A controlled Popover that ignores close requests caused by focus leaving it. Escape still closes it.',
    popups: ['Popover'],
    Demo() {
      const [open, setOpen] = React.useState(false);
      return (
        <Row>
          <BasicPopover
            open={open}
            onOpenChange={(nextOpen, details) => {
              if (!nextOpen && details.reason === 'focus-out') {
                return;
              }
              setOpen(nextOpen);
            }}
          >
            <Items names={['Item 1', 'Item 2']} />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Tab', focus: 'Item 2', open: ['Popover'] },
      {
        action: 'Tab',
        focus: 'After',
        open: ['Popover'],
        note: 'The popover stays open, but focus moves on instead of looping back into it.',
      },
      {
        action: 'Shift+Tab',
        focus: 'Item 2',
        open: ['Popover'],
        note: 'The open popover sits between its trigger and the next element in the tab order.',
      },
      { action: 'Shift+Tab', focus: 'Item 1', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Trigger', open: ['Popover'] },
      { action: 'Escape', focus: 'Trigger' },
    ],
  },
  {
    id: 'popover-no-trigger',
    title: 'Popover without a trigger',
    description: 'A controlled Popover opened by a separate button, with no Popover.Trigger.',
    popups: ['Popover'],
    Demo() {
      const { popup } = useLabels();
      const [open, setOpen] = React.useState(false);
      const anchorRef = React.useRef<HTMLButtonElement>(null);
      return (
        <div>
          <Button name="Open popover" ref={anchorRef} onClick={() => setOpen(true)} />
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Portal>
              <Popover.Positioner sideOffset={8} anchor={anchorRef}>
                <Popover.Popup {...popup('Popover')}>
                  <Items names={['Item 1', 'Item 2']} />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Button name="After" />
        </div>
      );
    },
    steps: [
      { action: 'click Open popover', focus: 'Item 1', open: ['Popover'] },
      { action: 'Tab', focus: 'Item 2', open: ['Popover'] },
      {
        action: 'Tab',
        focus: 'After',
        note: 'Tabbing out continues from where the popover is rendered in the page, and closes it.',
      },
      { action: 'Shift+Tab', focus: 'Open popover' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Escape', focus: 'Open popover' },
    ],
  },
  {
    id: 'popover-container',
    title: 'Popover rendered before its trigger',
    description:
      'The portal container comes before the trigger in the page. The tab order still follows the trigger.',
    popups: ['Popover'],
    Demo() {
      const containerRef = React.useRef<HTMLDivElement>(null);
      return (
        <div>
          <div ref={containerRef} />
          <Button name="Before" />
          <BasicPopover container={containerRef}>
            <Items names={['Item 1', 'Item 2']} />
          </BasicPopover>
          <Button name="After" />
        </div>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Tab', focus: 'Item 2', open: ['Popover'] },
      { action: 'Tab', focus: 'After' },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Trigger', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'popover-keep-mounted',
    title: 'Popover with keepMounted',
    description: 'The closed popover stays in the page, hidden, and must be skipped.',
    popups: ['Popover'],
    Demo() {
      return (
        <Row>
          <BasicPopover keepMounted>
            <Items names={['Item 1', 'Item 2']} />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Tab', focus: 'After', note: 'The hidden popover is skipped.' },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Tab', focus: 'Item 2', open: ['Popover'] },
      { action: 'Tab', focus: 'After' },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Trigger', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'menu-hover',
    title: 'Menu opened on hover',
    description: 'Hover the trigger, then keep the pointer still.',
    popups: ['Menu'],
    Demo() {
      return (
        <Row>
          <BasicMenu openOnHover />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      {
        action: 'hover Trigger',
        focus: 'Menu popup',
        open: ['Menu'],
        note: 'Unlike a Popover, a menu opened on hover takes focus, so the arrow keys work.',
      },
      { action: 'ArrowDown', focus: 'Item 1', open: ['Menu'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the menu and moves on.' },
      { action: 'Shift+Tab', focus: 'Trigger' },
    ],
  },
  {
    id: 'select',
    title: 'Select',
    description: 'Tab and Shift+Tab close the list without changing the value.',
    popups: ['Select'],
    Demo() {
      const { label, popup } = useLabels();
      return (
        <Row>
          <Select.Root>
            <Select.Trigger {...label('Select')}>
              <Select.Value placeholder="Select" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={8} alignItemWithTrigger={false}>
                <Select.Popup {...popup('Select')}>
                  <Select.List>
                    {fruits.map((fruit) => (
                      <Select.Item key={fruit} value={fruit} {...label(fruit)}>
                        <Select.ItemText>{fruit}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Select' },
      { action: 'Enter', focus: 'Apple', open: ['Select'] },
      { action: 'ArrowDown', focus: 'Banana', open: ['Select'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the list and moves on.' },
      { action: 'Shift+Tab', focus: 'Select' },
      { action: 'Enter', focus: 'Apple', open: ['Select'] },
      { action: 'Shift+Tab', focus: 'Select', note: 'Shift+Tab closes the list.' },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'combobox',
    title: 'Combobox',
    description: 'The input keeps focus while the list is open.',
    popups: ['Combobox'],
    Demo() {
      return (
        <Row>
          <BasicCombobox />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Input' },
      { action: 'ArrowDown', focus: 'Input', open: ['Combobox'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the list and moves on.' },
      { action: 'Shift+Tab', focus: 'Input' },
      { action: 'ArrowDown', focus: 'Input', open: ['Combobox'] },
      { action: 'Shift+Tab', focus: 'Before', note: 'Shift+Tab closes the list and moves back.' },
    ],
  },
  {
    id: 'combobox-inside',
    title: 'Combobox with the input in the popup',
    description: 'The trigger opens a popup whose input takes focus.',
    popups: ['Combobox'],
    Demo() {
      const { label, popup } = useLabels();
      return (
        <Row>
          <Combobox.Root items={fruits}>
            <Combobox.Trigger {...label('Trigger')}>
              <Combobox.Value placeholder="Trigger" />
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={8}>
                <Combobox.Popup {...popup('Combobox')}>
                  <Combobox.Input placeholder="Search" {...label('Search')} />
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} {...label(item)}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Search', open: ['Combobox'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the popup and moves on.' },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Search', open: ['Combobox'] },
      { action: 'Escape', focus: 'Trigger', note: 'Escape returns focus to the trigger.' },
    ],
  },
  {
    id: 'dialog-non-modal',
    title: 'Non-modal Dialog',
    description: 'Focus can leave a non-modal Dialog, which then closes.',
    popups: ['Dialog'],
    Demo() {
      return (
        <Row>
          <BasicDialog modal={false} />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog'] },
      { action: 'Tab', focus: 'Close', open: ['Dialog'] },
      {
        action: 'Tab',
        focus: 'After',
        note: 'Focus continues from where the dialog is rendered in the page; the dialog closes.',
      },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog'] },
      {
        action: 'Shift+Tab',
        focus: 'Trigger',
        open: ['Dialog'],
        note: 'Shift+Tab out of the first element reaches the trigger and keeps the dialog open.',
      },
      { action: 'Shift+Tab', focus: 'Before', note: 'Focus leaves the dialog, which closes.' },
    ],
  },
  {
    id: 'dialog-non-modal-persistent',
    title: 'Non-modal Dialog that stays open',
    description:
      'With disablePointerDismissal, a non-modal Dialog stays open when focus leaves, so focus can come back.',
    popups: ['Dialog'],
    Demo() {
      return (
        <Row>
          <BasicDialog modal={false} disablePointerDismissal />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog'] },
      { action: 'Tab', focus: 'Close', open: ['Dialog'] },
      { action: 'Tab', focus: 'After', open: ['Dialog'], note: 'Focus leaves; the dialog stays.' },
      {
        action: 'Shift+Tab',
        focus: 'Close',
        open: ['Dialog'],
        note: 'Shift+Tab comes back into the dialog, at its last element.',
      },
      { action: 'Shift+Tab', focus: 'Item 1', open: ['Dialog'] },
      { action: 'Shift+Tab', focus: 'Trigger', open: ['Dialog'] },
      {
        action: 'Tab',
        focus: 'Item 1',
        open: ['Dialog'],
        note: 'Tab from the trigger goes back into the dialog, at its first element.',
      },
      { action: 'Escape', focus: 'Trigger' },
    ],
  },
  {
    id: 'dialog-popover',
    title: 'Popover inside a Dialog',
    description: 'Leaving the popover keeps focus inside the dialog.',
    popups: ['Dialog', 'Popover'],
    Demo() {
      return (
        <div>
          <BasicDialog triggerName="Open dialog">
            <Button name="Start" />
            <BasicPopover triggerName="Popover">
              <Items names={['Item 1', 'Item 2']} />
            </BasicPopover>
            <Button name="End" />
          </BasicDialog>
        </div>
      );
    },
    steps: [
      { action: 'click Open dialog', focus: 'Start', open: ['Dialog'] },
      { action: 'Tab', focus: 'Popover', open: ['Dialog'] },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog', 'Popover'] },
      { action: 'Tab', focus: 'Item 2', open: ['Dialog', 'Popover'] },
      {
        action: 'Tab',
        focus: 'End',
        open: ['Dialog'],
        note: 'Tabbing out of the popover continues inside the dialog.',
      },
      { action: 'Tab', focus: 'Start', open: ['Dialog'], note: 'The dialog still wraps focus.' },
      { action: 'Shift+Tab', focus: 'End', open: ['Dialog'] },
      { action: 'Shift+Tab', focus: 'Popover', open: ['Dialog'] },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog', 'Popover'] },
      { action: 'Shift+Tab', focus: 'Popover', open: ['Dialog', 'Popover'] },
      {
        action: 'Escape',
        focus: 'Popover',
        open: ['Dialog'],
        note: 'Escape closes the popover only.',
      },
      { action: 'Escape', focus: 'Open dialog' },
    ],
  },
  {
    id: 'nested-popover',
    title: 'Popover inside a Popover',
    description: 'Tabbing out of the inner popover continues in the outer one.',
    popups: ['Outer', 'Inner'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <Button name="Inside before" />
            <BasicPopover name="Inner" triggerName="Inner">
              <Button name="Inner item" />
            </BasicPopover>
            <Button name="Inside after" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Inside before', open: ['Outer'] },
      { action: 'Tab', focus: 'Inner', open: ['Outer'] },
      { action: 'Enter', focus: 'Inner item', open: ['Outer', 'Inner'] },
      { action: 'Tab', focus: 'Inside after', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Inner', open: ['Outer'] },
      { action: 'Enter', focus: 'Inner item', open: ['Outer', 'Inner'] },
      { action: 'Shift+Tab', focus: 'Inner', open: ['Outer', 'Inner'] },
      { action: 'Shift+Tab', focus: 'Inside before', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Outer', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'nested-popover-only',
    title: 'Popover as the only content of a Popover',
    description: 'The inner trigger is the first and last tabbable element of the outer popover.',
    popups: ['Outer', 'Inner'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <BasicPopover name="Inner" triggerName="Inner">
              <Button name="Inner item" />
            </BasicPopover>
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Inner', open: ['Outer'] },
      { action: 'Enter', focus: 'Inner item', open: ['Outer', 'Inner'] },
      // The inner trigger's guard unmounts with the inner popup before focus reaches the outer
      // popup's guard, so that guard can't tell from the focus event where focus came from.
      { action: 'Tab', focus: 'After', note: 'Tabbing out of both popovers closes both.' },
      { action: 'Shift+Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Inner', open: ['Outer'] },
      { action: 'Enter', focus: 'Inner item', open: ['Outer', 'Inner'] },
      { action: 'Shift+Tab', focus: 'Inner', open: ['Outer', 'Inner'] },
      { action: 'Shift+Tab', focus: 'Outer', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'nested-menu',
    title: 'Menu inside a Popover',
    description: 'Tabbing out of the menu continues in the popover.',
    popups: ['Outer', 'Menu'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <Button name="Inside before" />
            <BasicMenu triggerName="Menu" />
            <Button name="Inside after" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Inside before', open: ['Outer'] },
      { action: 'Tab', focus: 'Menu', open: ['Outer'] },
      { action: 'Enter', focus: 'Item 1', open: ['Outer', 'Menu'] },
      { action: 'Tab', focus: 'Inside after', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Menu', open: ['Outer'] },
      { action: 'Enter', focus: 'Item 1', open: ['Outer', 'Menu'] },
      { action: 'Shift+Tab', focus: 'Menu', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Inside before', open: ['Outer'] },
    ],
  },
  {
    id: 'nested-menu-only',
    title: 'Menu as the only content of a Popover',
    description: 'The menu trigger is the first and last tabbable element of the popover.',
    popups: ['Outer', 'Menu'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <BasicMenu triggerName="Menu" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Menu', open: ['Outer'] },
      { action: 'Enter', focus: 'Item 1', open: ['Outer', 'Menu'] },
      // The inner trigger's guard unmounts with the inner popup before focus reaches the outer
      // popup's guard, so that guard can't tell from the focus event where focus came from.
      { action: 'Tab', focus: 'After', note: 'Tabbing out of the menu leaves the popover too.' },
      { action: 'Shift+Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Menu', open: ['Outer'] },
      { action: 'Enter', focus: 'Item 1', open: ['Outer', 'Menu'] },
      { action: 'Shift+Tab', focus: 'Menu', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Outer', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'nested-combobox',
    title: 'Combobox inside a Popover',
    description: 'Tabbing out of the combobox continues in the popover.',
    popups: ['Outer', 'Combobox'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <Button name="Inside before" />
            <BasicCombobox />
            <Button name="Inside after" />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Inside before', open: ['Outer'] },
      { action: 'Tab', focus: 'Input', open: ['Outer'] },
      { action: 'ArrowDown', focus: 'Input', open: ['Outer', 'Combobox'] },
      { action: 'Tab', focus: 'Inside after', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Input', open: ['Outer'] },
      { action: 'ArrowDown', focus: 'Input', open: ['Outer', 'Combobox'] },
      { action: 'Shift+Tab', focus: 'Inside before', open: ['Outer'] },
    ],
  },
  {
    id: 'nested-combobox-only',
    title: 'Combobox as the only content of a Popover',
    description: 'The combobox input is the first and last tabbable element of the popover.',
    popups: ['Outer', 'Combobox'],
    Demo() {
      return (
        <Row>
          <BasicPopover name="Outer" triggerName="Outer">
            <BasicCombobox />
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Input', open: ['Outer'] },
      { action: 'ArrowDown', focus: 'Input', open: ['Outer', 'Combobox'] },
      {
        action: 'Tab',
        focus: 'After',
        note: 'Tabbing out of the combobox leaves the popover too.',
      },
      { action: 'Shift+Tab', focus: 'Outer' },
      { action: 'Enter', focus: 'Input', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Outer', open: ['Outer'] },
      { action: 'Shift+Tab', focus: 'Before' },
    ],
  },
  {
    id: 'menubar',
    title: 'Menubar',
    description: 'A menubar is a single tab stop.',
    popups: ['File', 'Edit'],
    Demo() {
      const { label, popup } = useLabels();
      return (
        <Row>
          <Menubar>
            {[
              ['File', 'New', 'Open'],
              ['Edit', 'Undo', 'Redo'],
            ].map(([menu, ...items]) => (
              <Menu.Root key={menu}>
                <Menu.Trigger {...label(menu)}>{menu}</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="start">
                    <Menu.Popup {...popup(menu)}>
                      {items.map((item) => (
                        <Menu.Item key={item} {...label(item)}>
                          {item}
                        </Menu.Item>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            ))}
          </Menubar>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'File' },
      { action: 'Tab', focus: 'After', note: 'The other menus are reached with arrow keys.' },
      { action: 'Shift+Tab', focus: 'File' },
      { action: 'Enter', focus: 'New', open: ['File'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the menu and leaves the menubar.' },
      { action: 'Shift+Tab', focus: 'File' },
    ],
  },
];

function getFocusedLabel() {
  const element = document.activeElement;
  if (element == null || element === document.body) {
    return 'body';
  }
  if (element.hasAttribute('data-base-ui-focus-guard')) {
    return 'a focus guard';
  }
  return element.closest('[data-label]')?.getAttribute('data-label') ?? element.outerHTML;
}

function getOpenPopups(scenario: Scenario) {
  return scenario.popups.filter((name) =>
    document.querySelector(`[data-popup="${name}"]`)?.hasAttribute('data-open'),
  );
}

const KEYS: Record<string, string> = {
  Tab: '{Tab}',
  'Shift+Tab': '{Shift>}{Tab}{/Shift}',
  Enter: '{Enter}',
  Escape: '{Escape}',
  ArrowDown: '{ArrowDown}',
};

describe.skipIf(isJSDOM)('focus route scenarios', () => {
  const { render } = createRenderer();

  let user: Awaited<typeof import('vitest/browser')>['userEvent'];
  beforeAll(async () => {
    ({ userEvent: user } = await import('vitest/browser'));
  });

  afterEach(async () => {
    await resetBrowserPointer();
  });

  it.each(scenarios.map((scenario) => [scenario.title, scenario] as const))(
    '%s',
    async (_, scenario) => {
      ignoreActWarnings();
      const { Demo } = scenario;
      await render(<Demo />);

      // The steps depend on each other, so they run one after another.
      /* eslint-disable no-await-in-loop */
      for (const [index, step] of scenario.steps.entries()) {
        const { action } = step;
        if (action.startsWith('click ') || action.startsWith('hover ')) {
          const target = document.querySelector<HTMLElement>(`[data-label="${action.slice(6)}"]`)!;
          await (action.startsWith('click ') ? user.click(target) : user.hover(target));
        } else {
          await user.keyboard(KEYS[action]);
        }

        const description = `step ${index + 1} (${action})`;
        await waitFor(() => {
          expect([description, getFocusedLabel()]).toEqual([description, step.focus]);
        });
        await waitFor(() => {
          expect([description, getOpenPopups(scenario)]).toEqual([description, step.open ?? []]);
        });
      }
      /* eslint-enable no-await-in-loop */
    },
  );
});
