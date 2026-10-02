'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Field } from '@base-ui/react/field';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { Popover } from '@base-ui/react/popover';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Select } from '@base-ui/react/select';
import { useInterval } from '@base-ui/utils/useInterval';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { SettingsMetadata } from './_components/SettingsPanel';
import { useExperimentSettings } from './_components/SettingsPanel';
import styles from './popup-focus-return.module.css';

/**
 * Manual test bed for focus handling while a popup animates out: where focus goes when a popup
 * closes, whether the closing popup (still mounted for its exit animation) is skipped by Tab and
 * hidden from assistive technology, and how controlled consumers that refuse or defer close
 * requests behave.
 *
 * The exit animation is deliberately long by default so that the "closing but still mounted"
 * window can be observed.
 */

const CLOSE_POLICIES = ['accept', 'refuse', 'defer 150ms'] as const;
const FINAL_FOCUS = ['default', 'ref ("finalFocus target")', 'false'] as const;
const DELAYED_CLOSE_MS = 3000;

interface Settings {
  exitDuration: string;
  controlled: boolean;
  closePolicy: string;
  finalFocus: string;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  exitDuration: {
    type: 'string',
    label: 'Exit animation (ms)',
    options: ['0', '300', '2000', '5000'],
    default: '2000',
  },
  controlled: {
    type: 'boolean',
    label: 'Controlled open',
    default: false,
  },
  closePolicy: {
    type: 'string',
    label: 'Close requests (controlled only)',
    options: [...CLOSE_POLICIES],
    default: CLOSE_POLICIES[0],
  },
  finalFocus: {
    type: 'string',
    label: 'finalFocus',
    options: [...FINAL_FOCUS],
    default: FINAL_FOCUS[0],
  },
};

type FinalFocus = React.RefObject<HTMLElement | null> | false | undefined;

interface ExperimentContextValue {
  closeSignal: number;
  log: (message: string) => void;
  finalFocus: FinalFocus;
}

const ExperimentContext = React.createContext<ExperimentContextValue>({
  closeSignal: 0,
  log: () => {},
  finalFocus: undefined,
});

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Strawberry'];

export default function PopupFocusReturn() {
  const { settings } = useExperimentSettings<Settings>();
  const { entries, active, log, clear } = useFocusLog();
  const [closeSignal, setCloseSignal] = React.useState(0);
  const finalFocusTargetRef = React.useRef<HTMLButtonElement | null>(null);
  const outsideInputRef = React.useRef<HTMLInputElement | null>(null);
  const outsideInputId = React.useId();
  const delayedClose = useTimeout();

  const closeAllByProp = useStableCallback(() => {
    log(
      settings.controlled
        ? 'closing everything through the open prop'
        : 'close by prop: nothing to do, popups are uncontrolled',
    );
    setCloseSignal((value) => value + 1);
  });

  // Popups are portaled out of this tree, so the exit duration is set on the root element.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--exit-duration', `${settings.exitDuration}ms`);
    return () => {
      root.style.removeProperty('--exit-duration');
    };
  }, [settings.exitDuration]);

  // A modal popup blocks the toolbar, and with the "refuse" policy it can't be closed by the
  // user, so a shortcut closes everything by prop from anywhere.
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.code === 'KeyX') {
        event.preventDefault();
        closeAllByProp();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closeAllByProp]);

  const contextValue = React.useMemo<ExperimentContextValue>(
    () => ({
      closeSignal,
      log,
      finalFocus: resolveFinalFocus(settings.finalFocus, finalFocusTargetRef),
    }),
    [closeSignal, log, settings.finalFocus],
  );

  return (
    <ExperimentContext.Provider value={contextValue}>
      <div className={styles.Page}>
        <h1 className={styles.Title}>Popup focus return</h1>
        <p className={styles.Description}>
          Open a popup, close it (Escape, outside click, Tab out, item selection, hover out) and
          watch where focus goes in the log below. Focus should return when the popup closes, not
          when its exit animation ends, and the closing popup must be skipped by Tab and pointer
          events. Turn on controlled mode to refuse or defer close requests and to close popups
          through the <code>open</code> prop. <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> closes
          everything by prop, even while a modal popup blocks the page.
        </p>

        <div className={styles.Toolbar}>
          <button type="button" className={styles.Button}>
            Before
          </button>
          <button type="button" className={styles.Button} onClick={closeAllByProp}>
            Close all by prop
          </button>
          <button
            type="button"
            className={styles.Button}
            onClick={() => {
              log(`closing everything by prop in ${DELAYED_CLOSE_MS / 1000} s`);
              delayedClose.start(DELAYED_CLOSE_MS, closeAllByProp);
            }}
          >
            Close all by prop in {DELAYED_CLOSE_MS / 1000} s
          </button>
          <button type="button" className={styles.Button} ref={finalFocusTargetRef}>
            finalFocus target
          </button>
        </div>

        <div className={styles.Toolbar}>
          <span className={styles.ToolbarLabel}>Outside press targets:</span>
          <label htmlFor={outsideInputId} className={styles.Label}>
            Label for the input
          </label>
          <input
            id={outsideInputId}
            ref={outsideInputRef}
            className={styles.Input}
            placeholder="Outside input"
          />
          {/* Deliberately not focusable itself: the press lands on a non-focusable element and
              focus moves in its click handler. */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className={styles.ClickTarget} onClick={() => outsideInputRef.current?.focus()}>
            Click to focus the input
          </div>
        </div>

        {/* Popups must not switch between controlled and uncontrolled, so remount them. */}
        <div className={styles.Grid} key={String(settings.controlled)}>
          <PopoverCard title="Popover" note="modal={false}" />
          <PopoverCard title="Popover modal" note="modal · focus trapped, page inert" modal />
          <PopoverCard
            title="Popover hover"
            note="openOnHover · focus manager off while hover-opened"
            openOnHover
          />
          <MenuCard title="Menu" note="click · with a submenu" />
          <MenuCard title="Menu hover" note="openOnHover · with a submenu" openOnHover />
          <MenubarCard />
          <MenuDialogCard />
          <SelectFieldCard />
          <ComboboxOutsideCard />
          <ComboboxInsideCard />
          <DialogCard title="Dialog" note="modal · nested dialogs" />
          <DialogCard
            title="Dialog non-modal"
            note="modal={false} · nested dialogs"
            modal={false}
          />
          <AlertDialogCard />
          <DrawerCard />
          <PreviewCardCard />
        </div>

        <div className={styles.Toolbar}>
          <button type="button" className={styles.Button}>
            After
          </button>
        </div>

        <section className={styles.Log}>
          <div className={styles.LogHeader}>
            <div className={active.warning ? styles.LogWarn : undefined}>
              active element: <strong>{formatReport(active)}</strong>
            </div>
            <button type="button" className={styles.Button} onClick={clear}>
              Clear log
            </button>
          </div>
          <ol className={styles.LogList}>
            {entries.map((entry) => (
              <li key={entry.id} className={entry.warning ? styles.LogWarn : undefined}>
                {entry.time} {entry.message}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </ExperimentContext.Provider>
  );
}

function resolveFinalFocus(
  setting: string,
  targetRef: React.RefObject<HTMLElement | null>,
): FinalFocus {
  switch (setting) {
    case FINAL_FOCUS[1]:
      return targetRef;
    case FINAL_FOCUS[2]:
      return false;
    default:
      return undefined;
  }
}

interface OpenChangeDetails {
  reason: string;
}

/**
 * Logs every open change of a popup. In controlled mode, also owns the popup's `open` state and
 * applies the selected close policy to every close request.
 */
function usePopupControl(name: string) {
  const { settings } = useExperimentSettings<Settings>();
  const { closeSignal, log } = React.useContext(ExperimentContext);
  const [open, setOpen] = React.useState(false);
  const deferredClose = useTimeout();

  // A close driven by the `open` prop alone: no close request is dispatched.
  React.useEffect(() => {
    if (closeSignal > 0) {
      deferredClose.clear();
      setOpen(false);
    }
  }, [closeSignal, deferredClose]);

  const onOpenChange = useStableCallback((nextOpen: boolean, details: OpenChangeDetails) => {
    const action = `${nextOpen ? 'open' : 'close'} (${details.reason})`;

    if (!settings.controlled) {
      log(`${name}: ${action}`);
      return;
    }

    if (nextOpen) {
      deferredClose.clear();
    } else if (settings.closePolicy === 'refuse') {
      log(`${name}: ${action} refused`);
      return;
    } else if (settings.closePolicy === 'defer 150ms') {
      log(`${name}: ${action} deferred by 150 ms`);
      deferredClose.start(150, () => setOpen(false));
      return;
    }

    log(`${name}: ${action}`);
    setOpen(nextOpen);
  });

  return settings.controlled ? { open, onOpenChange } : { onOpenChange };
}

interface FocusReport {
  label: string;
  flags: string[];
  warning: boolean;
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  warning: boolean;
}

function describeElement(element: Element) {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const label =
    element.getAttribute('aria-label') ||
    element.getAttribute('placeholder') ||
    (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32);

  return `${tag}${role ? `[role=${role}]` : ''}${label ? ` "${label}"` : ''}`;
}

function inspectFocus(element: Element | null): FocusReport {
  if (element == null || element === document.body || element === document.documentElement) {
    return { label: '<body>', flags: ['⚠ focus lost to <body>'], warning: true };
  }

  const flags: string[] = [];
  if (element.matches(':focus-visible')) {
    flags.push('focus-visible');
  }

  const insideInert = element.closest('[inert]') != null;
  if (insideInert) {
    flags.push('⚠ inside an [inert] subtree');
  }

  return { label: describeElement(element), flags, warning: insideInert };
}

function formatReport(report: FocusReport) {
  return report.flags.length > 0 ? `${report.label}  [${report.flags.join(', ')}]` : report.label;
}

/**
 * Records focus moves. `focusin`/`focusout` catch regular moves; a poll catches the ones that fire
 * no event, such as the browser's focus fixup when the focused element becomes inert or is
 * removed.
 */
function useFocusLog() {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [active, setActive] = React.useState<FocusReport>({
    label: '<body>',
    flags: [],
    warning: false,
  });
  const startTimeRef = React.useRef(0);
  const nextIdRef = React.useRef(0);
  const lastActiveRef = React.useRef<Element | null>(null);
  const settleTimeout = useTimeout();
  const poll = useInterval();

  const addEntry = useStableCallback((message: string, warning: boolean) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    }
    const time = `${((performance.now() - startTimeRef.current) / 1000).toFixed(2)}s`;
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setEntries((previous) => [{ id, time, message, warning }, ...previous].slice(0, 40));
  });

  const log = useStableCallback((message: string) => addEntry(message, false));

  const clear = useStableCallback(() => {
    startTimeRef.current = 0;
    setEntries([]);
  });

  React.useEffect(() => {
    function report(element: Element | null, note = '') {
      lastActiveRef.current = element;
      const focusReport = inspectFocus(element);
      setActive(focusReport);
      addEntry(`focus → ${formatReport(focusReport)}${note}`, focusReport.warning);
    }

    function checkActiveElement(note: string) {
      const element = document.activeElement;
      if (element !== lastActiveRef.current) {
        report(element, note);
      }
    }

    function handleFocusIn(event: FocusEvent) {
      report(event.target as Element);
    }

    function handleFocusOut(event: FocusEvent) {
      if (event.relatedTarget == null) {
        // Focus is moving to <body> or out of the window: let it settle before reading it.
        settleTimeout.start(0, () => checkActiveElement(''));
      }
    }

    lastActiveRef.current = document.activeElement;
    poll.start(250, () => checkActiveElement('  (no focus event)'));
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    return () => {
      poll.clear();
      settleTimeout.clear();
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, [addEntry, poll, settleTimeout]);

  return { entries, active, log, clear };
}

function Card(props: { title: string; note: string; children: React.ReactNode }) {
  const { title, note, children } = props;
  return (
    <section className={styles.Card}>
      <h2 className={styles.CardTitle}>{title}</h2>
      <p className={styles.CardNote}>{note}</p>
      <div className={styles.CardRow}>{children}</div>
    </section>
  );
}

function Body(props: { title?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.Body}>
      {props.title && <div className={styles.BodyTitle}>{props.title}</div>}
      <button type="button" className={styles.Button}>
        Inside
      </button>
      <input className={styles.Input} placeholder="Inside input" />
      {props.children}
    </div>
  );
}

function PopoverCard(props: {
  title: string;
  note: string;
  modal?: boolean;
  openOnHover?: boolean;
}) {
  const { title, note, modal = false, openOnHover = false } = props;
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Popover.Root modal={modal} {...control}>
        <Popover.Trigger className={styles.Button} openOnHover={openOnHover} delay={100}>
          {title}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup} finalFocus={finalFocus}>
              <Body title={title}>
                <Popover.Close className={styles.Button}>Close</Popover.Close>
              </Body>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Card>
  );
}

function MenuItems(props: { title: string }) {
  const { log } = React.useContext(ExperimentContext);
  return (
    <React.Fragment>
      <Menu.Item className={styles.Item} onClick={() => log(`${props.title}: item selected`)}>
        Select and close
      </Menu.Item>
      <Menu.Item className={styles.Item} closeOnClick={false}>
        Stay open
      </Menu.Item>
    </React.Fragment>
  );
}

function MenuCard(props: { title: string; note: string; openOnHover?: boolean }) {
  const { title, note, openOnHover = false } = props;
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Menu.Root {...control}>
        <Menu.Trigger className={styles.Button} openOnHover={openOnHover} delay={100}>
          {title}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8}>
            <Menu.Popup className={`${styles.Popup} ${styles.ListPopup}`} finalFocus={finalFocus}>
              <MenuItems title={title} />
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.Item}>Submenu ▸</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={4}>
                    <Menu.Popup className={`${styles.Popup} ${styles.ListPopup}`}>
                      <MenuItems title={`${title} submenu`} />
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Card>
  );
}

function MenubarMenu(props: { title: string }) {
  const { title } = props;
  const control = usePopupControl(`Menubar ${title}`);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Menu.Root {...control}>
      <Menu.Trigger className={styles.Button}>{title}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="start">
          <Menu.Popup className={`${styles.Popup} ${styles.ListPopup}`} finalFocus={finalFocus}>
            <MenuItems title={`Menubar ${title}`} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MenubarCard() {
  return (
    <Card title="Menubar" note="two menus · arrow keys or hover switch between them">
      <Menubar className={styles.Menubar}>
        <MenubarMenu title="File" />
        <MenubarMenu title="Edit" />
      </Menubar>
    </Card>
  );
}

function MenuDialogCard() {
  const title = 'Menu → Dialog';
  const control = usePopupControl(title);
  const { finalFocus, log } = React.useContext(ExperimentContext);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <Card title={title} note="a menu item opens a controlled dialog">
      <Menu.Root {...control}>
        <Menu.Trigger className={styles.Button}>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8}>
            <Menu.Popup className={`${styles.Popup} ${styles.ListPopup}`} finalFocus={finalFocus}>
              <Menu.Item className={styles.Item} onClick={() => setDialogOpen(true)}>
                Open dialog…
              </Menu.Item>
              <Menu.Item className={styles.Item}>Another item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(nextOpen, details) => {
          log(`${title} dialog: ${nextOpen ? 'open' : 'close'} (${details.reason})`);
          setDialogOpen(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.DialogPopup} finalFocus={finalFocus}>
            <Dialog.Title className={styles.BodyTitle}>Opened from a menu item</Dialog.Title>
            <Body>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </Body>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}

function SelectFieldCard() {
  const title = 'Select';
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="in a Field validated on blur · the error appears once focus leaves">
      <Field.Root
        className={styles.Field}
        validationMode="onBlur"
        validate={(value) => (value == null ? 'Pick a fruit.' : null)}
      >
        <Select.Root {...control}>
          <Select.Label className={styles.Label}>Fruit</Select.Label>
          <Select.Trigger className={styles.Button}>
            <Select.Value placeholder="Pick a fruit" />
            <Select.Icon className={styles.Icon}>▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8}>
              <Select.Popup
                className={`${styles.Popup} ${styles.ListPopup}`}
                finalFocus={finalFocus}
              >
                <Select.List>
                  {fruits.map((fruit) => (
                    <Select.Item key={fruit} value={fruit} className={styles.Item}>
                      <Select.ItemText>{fruit}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Error className={styles.FieldError} />
      </Field.Root>
    </Card>
  );
}

function ComboboxItems() {
  return (
    <React.Fragment>
      <Combobox.Empty className={styles.Empty}>No fruit</Combobox.Empty>
      <Combobox.List>
        {(fruit: string) => (
          <Combobox.Item key={fruit} value={fruit} className={styles.Item}>
            {fruit}
          </Combobox.Item>
        )}
      </Combobox.List>
    </React.Fragment>
  );
}

function ComboboxOutsideCard() {
  const title = 'Combobox';
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="input outside the popup">
      <Combobox.Root items={fruits} {...control}>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input className={styles.Input} placeholder="Type a fruit" />
          <Combobox.Trigger className={styles.InputTrigger} aria-label="Open popup">
            ▾
          </Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={8}>
            <Combobox.Popup
              className={`${styles.Popup} ${styles.ListPopup}`}
              finalFocus={finalFocus}
            >
              <ComboboxItems />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Card>
  );
}

function ComboboxInsideCard() {
  const title = 'Combobox input inside';
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="input inside the popup · goes inert with the popup">
      <Combobox.Root items={fruits} {...control}>
        <Combobox.Trigger className={styles.Button}>
          <Combobox.Value placeholder="Pick a fruit" />
          <Combobox.Icon className={styles.Icon}>▾</Combobox.Icon>
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={8}>
            <Combobox.Popup
              className={`${styles.Popup} ${styles.ListPopup}`}
              finalFocus={finalFocus}
              aria-label="Pick a fruit"
            >
              <div className={styles.PopupInputWrap}>
                <Combobox.Input className={styles.Input} placeholder="Search fruits" />
              </div>
              <ComboboxItems />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Card>
  );
}

function NestedDialog(props: { title: string; container?: HTMLElement; closeParent: () => void }) {
  const { title, container, closeParent } = props;
  const { finalFocus, log } = React.useContext(ExperimentContext);
  const actionsRef = React.useRef<Dialog.Root.Actions | null>(null);

  return (
    <Dialog.Root
      actionsRef={actionsRef}
      onOpenChange={(nextOpen, details) => {
        log(`${title}: ${nextOpen ? 'open' : 'close'} (${details.reason})`);
      }}
    >
      <Dialog.Trigger className={styles.Button}>{title}</Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Popup
          className={`${styles.DialogPopup} ${styles.NestedDialogPopup}`}
          finalFocus={finalFocus}
        >
          <Dialog.Title className={styles.BodyTitle}>{title}</Dialog.Title>
          <div className={styles.Body}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            <button type="button" className={styles.Button} onClick={closeParent}>
              Close parent only
            </button>
            <button
              type="button"
              className={styles.Button}
              onClick={() => {
                closeParent();
                actionsRef.current?.close();
              }}
            >
              Close both
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogCard(props: { title: string; note: string; modal?: boolean }) {
  const { title, note, modal = true } = props;
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);
  const actionsRef = React.useRef<Dialog.Root.Actions | null>(null);
  const closeParent = () => actionsRef.current?.close();

  return (
    <Card title={title} note={note}>
      <Dialog.Root modal={modal} actionsRef={actionsRef} {...control}>
        <Dialog.Trigger className={styles.Button}>{title}</Dialog.Trigger>
        <Dialog.Portal>
          {modal && <Dialog.Backdrop className={styles.Backdrop} />}
          <Dialog.Popup className={styles.DialogPopup} finalFocus={finalFocus}>
            <Dialog.Title className={styles.BodyTitle}>{title}</Dialog.Title>
            <Body>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              <NestedDialog title="Nested dialog" closeParent={closeParent} />
              {/* The popup only renders on the client, so `document` is available here. */}
              <NestedDialog
                title="Nested dialog (container=body)"
                container={document.body}
                closeParent={closeParent}
              />
            </Body>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}

function AlertDialogCard() {
  const title = 'Alert dialog';
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="modal · no outside-press dismissal">
      <AlertDialog.Root {...control}>
        <AlertDialog.Trigger className={styles.Button}>{title}</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.Backdrop} />
          <AlertDialog.Popup className={styles.DialogPopup} finalFocus={finalFocus}>
            <AlertDialog.Title className={styles.BodyTitle}>{title}</AlertDialog.Title>
            <Body>
              <AlertDialog.Close className={styles.Button}>Close</AlertDialog.Close>
            </Body>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Card>
  );
}

function DrawerCard() {
  const title = 'Drawer';
  const control = usePopupControl(title);
  const { finalFocus } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="modal · swipe right to dismiss; stays interactive while swiping">
      <Drawer.Root swipeDirection="right" {...control}>
        <Drawer.Trigger className={styles.Button}>{title}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.DrawerViewport}>
            <Drawer.Popup className={styles.DrawerPopup} finalFocus={finalFocus}>
              <Drawer.Content className={styles.DrawerContent}>
                <Drawer.Title className={styles.BodyTitle}>{title}</Drawer.Title>
                <Body>
                  <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                </Body>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </Card>
  );
}

function PreviewCardCard() {
  const title = 'Preview card';
  const control = usePopupControl(title);

  return (
    <Card title={title} note="hover or focus the link · links inside go inert on close">
      <PreviewCard.Root {...control}>
        <PreviewCard.Trigger href="#preview" className={styles.Link}>
          {title}
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup}>
              <div className={styles.Body}>
                <div className={styles.BodyTitle}>{title}</div>
                <a href="#one" className={styles.Link}>
                  Link one
                </a>
                <a href="#two" className={styles.Link}>
                  Link two
                </a>
              </div>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>
    </Card>
  );
}
