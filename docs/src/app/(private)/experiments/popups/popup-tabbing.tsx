'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { Popover } from '@base-ui/react/popover';
import { Select } from '@base-ui/react/select';
import { Timeout } from '@base-ui/utils/useTimeout';
import styles from './popup-tabbing.module.css';

/**
 * Keyboard focus scenarios for popups: tabbing into, out of and back into Popover, Menu, Select,
 * Combobox, Dialog, NavigationMenu and Menubar, alone and nested.
 *
 * Each scenario lists its steps and where focus should be after each one. Start a scenario by
 * clicking its first target, then follow the steps: every step is checked as you perform it.
 * Each scenario card exposes its state in `data-status`, and each step its expectations and
 * result in `data-*` attributes, so a browser automation can drive the same scenarios.
 */

type Key =
  | 'Tab'
  | 'Shift+Tab'
  | 'Enter'
  | 'Space'
  | 'Escape'
  | 'ArrowDown'
  | 'ArrowUp'
  | 'ArrowLeft'
  | 'ArrowRight';

type Action = Key | `click ${string}` | `hover ${string}`;

interface Step {
  /** A key to press, or a labeled element to click or hover. */
  action: Action;
  /** The labeled element that should have focus once the step settles. */
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
  /** The names of the scenario's popups, as passed to `popup()`. */
  popups: string[];
  steps: Step[];
  Demo: React.ComponentType;
}

type RunStatus = 'idle' | 'running' | 'passed' | 'failed' | 'interrupted';

interface StepResult {
  ok: boolean;
  actual: string;
}

interface Run {
  status: RunStatus;
  results: StepResult[];
  message: string | null;
  /** Every element that received focus while the scenario ran, focus guards included. */
  trail: string[];
}

const IDLE_RUN: Run = { status: 'idle', results: [], message: null, trail: [] };

// Long enough for focus moves made in an animation frame (initial focus) and for short exit
// transitions; short enough to keep up with a person pressing keys.
const SETTLE_MS = 250;
const HOVER_SETTLE_MS = 500;

const KEY_ACTIONS: Record<string, Key> = {
  Enter: 'Enter',
  ' ': 'Space',
  Escape: 'Escape',
  ArrowDown: 'ArrowDown',
  ArrowUp: 'ArrowUp',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
};

function getKeyAction(event: KeyboardEvent): Key | null {
  if (event.key === 'Tab') {
    return event.shiftKey ? 'Shift+Tab' : 'Tab';
  }
  return KEY_ACTIONS[event.key] ?? null;
}

// Labels are `<scenario id>/<name>`, so the same name can appear in every scenario.
function splitLabel(value: string): [scenario: string, name: string] {
  const index = value.indexOf('/');
  return [value.slice(0, index), value.slice(index + 1)];
}

function getLabel(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest('[data-label]') : null;
  const value = element?.getAttribute('data-label');
  return value ? splitLabel(value) : null;
}

function describeFocus(element: Element | null, scenarioId: string | null) {
  if (element == null || element === element.ownerDocument.body) {
    return { inScenario: false, name: 'the page body' };
  }
  if (element.hasAttribute('data-base-ui-focus-guard')) {
    return { inScenario: false, name: 'a focus guard' };
  }
  const label = getLabel(element);
  if (label) {
    const [scenario, name] = label;
    return scenario === scenarioId
      ? { inScenario: true, name }
      : { inScenario: false, name: `${name} (in another scenario)` };
  }
  const text = (element.getAttribute('aria-label') ?? element.textContent ?? '').trim();
  return {
    inScenario: false,
    name: `<${element.tagName.toLowerCase()}>${text ? ` "${text.slice(0, 24)}"` : ''}`,
  };
}

function getOpenPopups(scenario: Scenario) {
  return scenario.popups.filter((name) =>
    document.querySelector(`[data-popup="${scenario.id}/${name}"]`)?.hasAttribute('data-open'),
  );
}

function describeAction(action: Action) {
  if (action.startsWith('click ') || action.startsWith('hover ')) {
    const [verb, ...name] = action.split(' ');
    return `${verb === 'click' ? 'Click' : 'Hover'} “${name.join(' ')}”`;
  }
  return action;
}

class ScenarioRunner {
  runs: Readonly<Record<string, Run>> = {};

  private active: Scenario | null = null;

  private pendingCheck: (() => void) | null = null;

  private readonly timeout = Timeout.create();

  private readonly listeners = new Set<() => void>();

  constructor(private readonly scenarios: Scenario[]) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.runs;

  getRun(id: string) {
    return this.runs[id] ?? IDLE_RUN;
  }

  reset(id: string) {
    this.timeout.clear();
    this.pendingCheck = null;
    if (this.active?.id === id) {
      this.active = null;
    }
    this.update(id, IDLE_RUN);
  }

  /** A key press, or a click on an element. `scenarioId` is the clicked element's scenario. */
  handleAction(action: Action | 'click', scenarioId: string | null) {
    // Check the previous step before this action changes what it left behind.
    this.flush();

    const starting =
      scenarioId == null
        ? undefined
        : this.scenarios.find(
            (scenario) => scenario.id === scenarioId && scenario.steps[0].action === action,
          );
    if (starting) {
      this.interrupt('Another scenario started.');
      this.active = starting;
      this.update(starting.id, { ...IDLE_RUN, status: 'running' });
      this.schedule(starting, SETTLE_MS);
      return;
    }

    const scenario = this.active;
    const run = scenario ? this.getRun(scenario.id) : null;
    if (!scenario || run?.status !== 'running') {
      return;
    }

    const step = scenario.steps[run.results.length];
    if (step.action === action && (scenarioId == null || scenarioId === scenario.id)) {
      this.schedule(scenario, SETTLE_MS);
      return;
    }

    // Anything else changes focus in ways the remaining steps don't account for.
    this.interrupt(
      `${action === 'click' ? 'A click elsewhere' : describeAction(action)} isn't the next step ` +
        `(${describeAction(step.action)}). Reset the scenario to try again.`,
    );
  }

  handleHover(action: Action, scenarioId: string) {
    const scenario = this.active;
    const run = scenario ? this.getRun(scenario.id) : null;
    if (
      scenario?.id === scenarioId &&
      run?.status === 'running' &&
      scenario.steps[run.results.length].action === action
    ) {
      this.schedule(scenario, HOVER_SETTLE_MS);
    }
  }

  recordFocus(target: Element) {
    const scenario = this.active;
    const run = scenario ? this.getRun(scenario.id) : null;
    if (scenario && run?.status === 'running') {
      const { name } = describeFocus(target, scenario.id);
      this.update(scenario.id, { ...run, trail: [...run.trail, name].slice(-40) });
    }
  }

  flush = () => {
    const check = this.pendingCheck;
    this.pendingCheck = null;
    this.timeout.clear();
    check?.();
  };

  private schedule(scenario: Scenario, delay: number) {
    this.pendingCheck = () => this.check(scenario);
    this.timeout.start(delay, this.flush);
  }

  private check(scenario: Scenario) {
    const run = this.getRun(scenario.id);
    if (run.status !== 'running') {
      return;
    }

    const step = scenario.steps[run.results.length];
    const focus = describeFocus(document.activeElement, scenario.id);
    const open = getOpenPopups(scenario);
    const expectedOpen = step.open ?? [];
    const ok =
      focus.inScenario &&
      focus.name === step.focus &&
      open.length === expectedOpen.length &&
      expectedOpen.every((name) => open.includes(name));

    const results = [
      ...run.results,
      { ok, actual: `${focus.name} · ${open.length > 0 ? `${open.join(', ')} open` : 'closed'}` },
    ];
    let status: RunStatus = 'running';
    if (!ok) {
      status = 'failed';
    } else if (results.length === scenario.steps.length) {
      status = 'passed';
    }
    this.update(scenario.id, { ...run, status, results });
  }

  private interrupt(message: string) {
    const scenario = this.active;
    if (scenario && this.getRun(scenario.id).status === 'running') {
      this.update(scenario.id, { ...this.getRun(scenario.id), status: 'interrupted', message });
    }
    this.active = null;
  }

  private update(id: string, run: Run) {
    this.runs = { ...this.runs, [id]: run };
    this.listeners.forEach((listener) => listener());
  }
}

const ScenarioIdContext = React.createContext('');

/** Returns the props that label an element, or mark a popup, within the current scenario. */
function useLabels() {
  const id = React.useContext(ScenarioIdContext);
  return React.useMemo(
    () => ({
      label: (name: string) => ({ 'data-label': `${id}/${name}` }),
      popup: (name: string) => ({
        'data-popup': `${id}/${name}`,
        'data-label': `${id}/${name} popup`,
      }),
    }),
    [id],
  );
}

function Button(props: { name: string; onClick?: () => void; ref?: React.Ref<HTMLButtonElement> }) {
  const { label } = useLabels();
  return (
    <button
      ref={props.ref}
      type="button"
      className={styles.Button}
      onClick={props.onClick}
      {...label(props.name)}
    >
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
      <Popover.Trigger
        className={styles.Button}
        openOnHover={openOnHover}
        delay={0}
        closeDelay={0}
        {...label(triggerName)}
      >
        {triggerName}
      </Popover.Trigger>
      <Popover.Portal keepMounted={keepMounted} container={container}>
        <Popover.Positioner className={styles.Positioner} sideOffset={8}>
          <Popover.Popup className={styles.Popup} {...popup(name)}>
            {children}
          </Popover.Popup>
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
      <Menu.Trigger
        className={styles.Button}
        openOnHover={openOnHover}
        delay={0}
        closeDelay={0}
        {...label(triggerName)}
      >
        {triggerName}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup} {...popup(name)}>
            {['Item 1', 'Item 2'].map((item) => (
              <Menu.Item key={item} className={styles.Item} {...label(item)}>
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
      <Combobox.InputGroup className={styles.InputGroup}>
        <Combobox.Input className={styles.Input} placeholder="Input" {...label('Input')} />
        <Combobox.Trigger className={styles.InputTrigger} aria-label="Open popup">
          ▾
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={8}>
          <Combobox.Popup className={styles.Popup} {...popup(name)}>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={styles.Item} {...label(item)}>
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
      <Dialog.Trigger className={styles.Button} {...label(triggerName)}>
        {triggerName}
      </Dialog.Trigger>
      <Dialog.Portal>
        {rootProps.modal !== false && <Dialog.Backdrop className={styles.Backdrop} />}
        <Dialog.Popup
          className={rootProps.modal === false ? styles.FloatingDialog : styles.Dialog}
          {...popup('Dialog')}
        >
          <Dialog.Title className={styles.DialogTitle}>Dialog</Dialog.Title>
          {children ?? (
            <React.Fragment>
              <Button name="Item 1" />
              <Dialog.Close className={styles.Button} {...label('Close')}>
                Close
              </Dialog.Close>
            </React.Fragment>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row(props: { children: React.ReactNode }) {
  return (
    <div className={styles.Row}>
      <Button name="Before" />
      {props.children}
      <Button name="After" />
    </div>
  );
}

/* Scenarios */

const scenarios: Scenario[] = [
  {
    id: 'popover',
    title: 'Popover: tab out and back',
    description: 'A non-modal Popover follows its trigger in the tab order.',
    popups: ['Popover'],
    Demo() {
      return (
        <Row>
          <BasicPopover>
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
        note: 'Tabbing out of the last item closes the popover and continues after the trigger.',
      },
      { action: 'Shift+Tab', focus: 'Trigger', note: 'The closed popover is skipped.' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      {
        action: 'Shift+Tab',
        focus: 'Trigger',
        open: ['Popover'],
        note: 'Shift+Tab out of the first item returns to the trigger and keeps the popover open.',
      },
      {
        action: 'Tab',
        focus: 'Item 1',
        open: ['Popover'],
        note: 'Tab from the trigger goes back into the open popover.',
      },
      { action: 'Shift+Tab', focus: 'Trigger', open: ['Popover'] },
      { action: 'Shift+Tab', focus: 'Before', note: 'Leaving the trigger backwards closes it.' },
    ],
  },
  {
    id: 'popover-modal',
    title: 'Popover with modal and a Close button',
    description: 'A modal Popover with a Close part traps focus.',
    popups: ['Popover'],
    Demo() {
      const { label } = useLabels();
      return (
        <Row>
          <BasicPopover modal>
            <Button name="Item 1" />
            <Popover.Close className={styles.Button} {...label('Close')}>
              Close
            </Popover.Close>
          </BasicPopover>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Popover'] },
      { action: 'Tab', focus: 'Close', open: ['Popover'] },
      { action: 'Tab', focus: 'Item 1', open: ['Popover'], note: 'Focus wraps around.' },
      { action: 'Shift+Tab', focus: 'Close', open: ['Popover'] },
      { action: 'Escape', focus: 'Trigger', note: 'Escape returns focus to the trigger.' },
      { action: 'Tab', focus: 'After' },
    ],
  },
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
        <div className={styles.Row}>
          <Button name="Open popover" ref={anchorRef} onClick={() => setOpen(true)} />
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Portal>
              <Popover.Positioner className={styles.Positioner} sideOffset={8} anchor={anchorRef}>
                <Popover.Popup className={styles.Popup} {...popup('Popover')}>
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
        <div className={styles.Row}>
          <div ref={containerRef} className={styles.Container} />
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
    id: 'menu',
    title: 'Menu: tab out and back',
    description: 'Tab and Shift+Tab both close a menu.',
    popups: ['Menu'],
    Demo() {
      return (
        <Row>
          <BasicMenu />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Menu'] },
      { action: 'ArrowDown', focus: 'Item 2', open: ['Menu'] },
      { action: 'Tab', focus: 'After', note: 'Tab closes the menu and moves on.' },
      { action: 'Shift+Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Menu'] },
      {
        action: 'Shift+Tab',
        focus: 'Trigger',
        note: 'Shift+Tab closes the menu and returns to its trigger.',
      },
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
            <Select.Trigger className={styles.Button} {...label('Select')}>
              <Select.Value placeholder="Select" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner
                className={styles.Positioner}
                sideOffset={8}
                alignItemWithTrigger={false}
              >
                <Select.Popup className={styles.Popup} {...popup('Select')}>
                  <Select.List>
                    {fruits.map((fruit) => (
                      <Select.Item
                        key={fruit}
                        value={fruit}
                        className={styles.Item}
                        {...label(fruit)}
                      >
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
            <Combobox.Trigger className={styles.Button} {...label('Trigger')}>
              <Combobox.Value placeholder="Trigger" />
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner className={styles.Positioner} sideOffset={8}>
                <Combobox.Popup className={styles.Popup} {...popup('Combobox')}>
                  <Combobox.Input
                    className={styles.Input}
                    placeholder="Search"
                    {...label('Search')}
                  />
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item
                        key={item}
                        value={item}
                        className={styles.Item}
                        {...label(item)}
                      >
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
    id: 'dialog',
    title: 'Dialog',
    description: 'A modal Dialog traps focus.',
    popups: ['Dialog'],
    Demo() {
      return (
        <Row>
          <BasicDialog />
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Trigger' },
      { action: 'Enter', focus: 'Item 1', open: ['Dialog'] },
      { action: 'Tab', focus: 'Close', open: ['Dialog'] },
      { action: 'Tab', focus: 'Item 1', open: ['Dialog'], note: 'Focus wraps around.' },
      { action: 'Shift+Tab', focus: 'Close', open: ['Dialog'] },
      { action: 'Escape', focus: 'Trigger' },
      { action: 'Tab', focus: 'After' },
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
        <div className={styles.Row}>
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
    id: 'navigation-menu',
    title: 'Navigation menu',
    description: 'Tab moves through the open content, then on to the next item.',
    popups: ['Overview'],
    Demo() {
      const { label, popup } = useLabels();
      return (
        <Row>
          <NavigationMenu.Root className={styles.NavigationMenu}>
            <NavigationMenu.List className={styles.NavigationMenuList}>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={styles.Button} {...label('Overview')}>
                  Overview
                </NavigationMenu.Trigger>
                <NavigationMenu.Content
                  className={styles.NavigationMenuContent}
                  {...popup('Overview')}
                >
                  {['Link 1', 'Link 2'].map((name) => (
                    <NavigationMenu.Link
                      key={name}
                      className={styles.Button}
                      href="#"
                      {...label(name)}
                    >
                      {name}
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link className={styles.Button} href="#" {...label('Docs')}>
                  Docs
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner className={styles.Positioner} sideOffset={8}>
                <NavigationMenu.Popup className={styles.Popup}>
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        </Row>
      );
    },
    steps: [
      { action: 'click Before', focus: 'Before' },
      { action: 'Tab', focus: 'Overview' },
      { action: 'Enter', focus: 'Overview', open: ['Overview'] },
      { action: 'Tab', focus: 'Link 1', open: ['Overview'], note: 'Tab enters the open content.' },
      { action: 'Tab', focus: 'Link 2', open: ['Overview'] },
      {
        action: 'Tab',
        focus: 'Docs',
        open: ['Overview'],
        note: 'The content stays open while focus is still in the navigation menu.',
      },
      {
        action: 'Shift+Tab',
        focus: 'Link 2',
        open: ['Overview'],
        note: 'Shift+Tab goes back into the open content, at its last link.',
      },
      { action: 'Tab', focus: 'Docs', open: ['Overview'] },
      { action: 'Tab', focus: 'After', note: 'Leaving the navigation menu closes the content.' },
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
          <Menubar className={styles.Menubar}>
            {[
              ['File', 'New', 'Open'],
              ['Edit', 'Undo', 'Redo'],
            ].map(([menu, ...items]) => (
              <Menu.Root key={menu}>
                <Menu.Trigger className={styles.Button} {...label(menu)}>
                  {menu}
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.Positioner} sideOffset={8} align="start">
                    <Menu.Popup className={styles.Popup} {...popup(menu)}>
                      {items.map((item) => (
                        <Menu.Item key={item} className={styles.Item} {...label(item)}>
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

/* Runner UI */

function useRun(runner: ScenarioRunner, id: string) {
  const runs = React.useSyncExternalStore(runner.subscribe, runner.getSnapshot, runner.getSnapshot);
  return runs[id] ?? IDLE_RUN;
}

const STATUS_TEXT: Record<RunStatus, string> = {
  idle: 'Not run',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  interrupted: 'Interrupted',
};

function ScenarioCard(props: { scenario: Scenario; runner: ScenarioRunner }) {
  const { scenario, runner } = props;
  const run = useRun(runner, scenario.id);
  const { Demo } = scenario;

  return (
    <section className={styles.Scenario} data-scenario={scenario.id} data-status={run.status}>
      <header className={styles.ScenarioHeader}>
        <h2 className={styles.ScenarioTitle}>{scenario.title}</h2>
        <span className={styles.Status} data-status={run.status}>
          {STATUS_TEXT[run.status]}
        </span>
      </header>
      <p className={styles.ScenarioDescription}>{scenario.description}</p>

      <ScenarioIdContext.Provider value={scenario.id}>
        <Demo />
      </ScenarioIdContext.Provider>

      <ol className={styles.Steps}>
        {scenario.steps.map((step, index) => {
          const result = run.results[index];
          let state = 'pending';
          if (result) {
            state = result.ok ? 'passed' : 'failed';
          } else if (run.status === 'running' && index === run.results.length) {
            state = 'current';
          }
          return (
            <li
              key={index}
              className={styles.Step}
              data-state={state}
              data-action={step.action}
              data-expected={`${step.focus} · ${step.open?.length ? `${step.open.join(', ')} open` : 'closed'}`}
              data-actual={result?.actual}
            >
              <span className={styles.StepAction}>{describeAction(step.action)}</span>
              <span className={styles.StepExpected}>
                → <strong>{step.focus}</strong>
                {step.open?.length ? ` · ${step.open.join(', ')} open` : ''}
              </span>
              {step.note && <span className={styles.StepNote}>{step.note}</span>}
              {result && !result.ok && (
                <span className={styles.StepActual}>Got: {result.actual}</span>
              )}
            </li>
          );
        })}
      </ol>

      {run.message && <p className={styles.Message}>{run.message}</p>}

      <footer className={styles.ScenarioFooter}>
        <button
          type="button"
          className={styles.LinkButton}
          data-runner-control=""
          onClick={() => runner.reset(scenario.id)}
        >
          Reset
        </button>
        {run.trail.length > 0 && (
          <span className={styles.Trail} title="Every element that received focus, in order">
            Focus trail: {run.trail.join(' → ')}
          </span>
        )}
      </footer>
    </section>
  );
}

function Summary(props: { runner: ScenarioRunner }) {
  const runs = React.useSyncExternalStore(
    props.runner.subscribe,
    props.runner.getSnapshot,
    props.runner.getSnapshot,
  );
  const statuses = scenarios.map((scenario) => runs[scenario.id]?.status ?? 'idle');
  const count = (status: RunStatus) => statuses.filter((value) => value === status).length;
  return (
    <p className={styles.Summary} data-summary="">
      <span data-status="passed">{count('passed')} passed</span>
      <span data-status="failed">{count('failed')} failed</span>
      <span>{scenarios.length - count('passed') - count('failed')} not finished</span>
    </p>
  );
}

function FocusIndicator() {
  const [focused, setFocused] = React.useState('the page body');

  React.useEffect(() => {
    function update() {
      const label = getLabel(document.activeElement);
      setFocused(
        label ? `${label[1]} (${label[0]})` : describeFocus(document.activeElement, null).name,
      );
    }
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  return (
    <p className={styles.FocusIndicator}>
      Focused: <strong>{focused}</strong>
    </p>
  );
}

export default function PopupTabbing() {
  const [runner] = React.useState(() => new ScenarioRunner(scenarios));

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = getKeyAction(event);
      if (action && !event.repeat) {
        runner.handleAction(action, null);
      }
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as Element;
      // A click made by Enter or Space on a button is part of that key's step.
      if (event.detail === 0 || target.closest('[data-runner-control]')) {
        return;
      }
      const label = getLabel(target);
      runner.handleAction(label ? `click ${label[1]}` : 'click', label?.[0] ?? null);
    }

    function handlePointerOver(event: PointerEvent) {
      const label = getLabel(event.target);
      if (label) {
        runner.handleHover(`hover ${label[1]}`, label[0]);
      }
    }

    function handleFocusIn(event: FocusEvent) {
      runner.recordFocus(event.target as Element);
    }

    // Capture phase: record what the user did before the components react to it.
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      runner.flush();
    };
  }, [runner]);

  return (
    <div className={styles.Page}>
      <h1 className={styles.Title}>Popup tabbing</h1>
      <p className={styles.Description}>
        Keyboard focus scenarios for popups. Start a scenario by doing its first step (usually
        clicking “Before”), then follow the steps in order. Each step is checked as you do it: where
        focus lands and which popups are open. Any other key or click interrupts the scenario.
      </p>
      <div className={styles.Toolbar}>
        <Summary runner={runner} />
        <FocusIndicator />
      </div>
      <div className={styles.Scenarios}>
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} runner={runner} />
        ))}
      </div>
    </div>
  );
}
