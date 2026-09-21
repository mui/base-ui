'use client';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Select } from '@base-ui/react/select';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { SettingsMetadata, useExperimentSettings } from './_components/SettingsPanel';
import styles from './popup-focus-return.module.css';

/**
 * Manual test bed for focus handling around the logical close of a popup: where focus goes when a
 * popup closes, whether a closing popup (still mounted for its exit animation) is skipped by Tab,
 * and how controlled consumers that refuse or defer close requests behave.
 *
 * The exit animation is deliberately long by default so the "closing but still mounted" window
 * can be observed: close a popup with Escape and press Tab while it fades out.
 */

const CLOSE_POLICIES = ['accept', 'refuse focus-out & hover', 'defer 150ms'] as const;
const FINAL_FOCUS = [
  'default',
  'ref (target button)',
  '() => true',
  '() => null',
  'false',
] as const;

interface Settings {
  exitDuration: string;
  controlled: boolean;
  closePolicy: string;
  finalFocus: string;
  nestedPopover: boolean;
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
  nestedPopover: {
    type: 'boolean',
    label: 'Nested popover inside popups',
    default: false,
  },
};

type FinalFocus = Popover.Popup.Props['finalFocus'];

interface ExperimentContextValue {
  closeSignal: number;
  log: (message: string) => void;
  finalFocus: FinalFocus;
  exitStyle: React.CSSProperties;
  nested: boolean;
}

const ExperimentContext = React.createContext<ExperimentContextValue>({
  closeSignal: 0,
  log: () => {},
  finalFocus: undefined,
  exitStyle: {},
  nested: false,
});

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Strawberry'];

/**
 * When the experiment is in controlled mode, owns the popup's `open` state and applies the
 * selected close policy to every close request. Otherwise returns nothing, leaving the popup
 * uncontrolled.
 */
function usePopupControl(name: string) {
  const { settings } = useExperimentSettings<Settings>();
  const { closeSignal, log } = React.useContext(ExperimentContext);
  const [open, setOpen] = React.useState(false);
  const deferredClose = useTimeout();

  // A close driven by the `open` prop alone: nothing is dispatched to the popup.
  React.useEffect(() => {
    if (closeSignal > 0) {
      setOpen(false);
    }
  }, [closeSignal]);

  const onOpenChange = useStableCallback((nextOpen: boolean, details: { reason: string }) => {
    if (!nextOpen) {
      const refusable = details.reason === 'focus-out' || details.reason === 'trigger-hover';
      if (settings.closePolicy === CLOSE_POLICIES[1] && refusable) {
        log(`${name}: refused "${details.reason}" close`);
        return;
      }
      if (settings.closePolicy === CLOSE_POLICIES[2]) {
        log(`${name}: "${details.reason}" close deferred by 150 ms`);
        deferredClose.start(150, () => setOpen(false));
        return;
      }
    }
    setOpen(nextOpen);
  });

  if (!settings.controlled) {
    return {};
  }

  return { open, onOpenChange };
}

function describeElement(element: Element | null) {
  if (!element || element === document.body) {
    return 'body';
  }
  const tag = element.tagName.toLowerCase();
  const label =
    element.getAttribute('aria-label') ||
    element.getAttribute('placeholder') ||
    (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28) ||
    element.id;
  return label ? `${tag} "${label}"` : tag;
}

function useFocusLog() {
  const [entries, setEntries] = React.useState<string[]>([]);
  const [activeLabel, setActiveLabel] = React.useState('body');
  const startRef = React.useRef(0);

  const log = useStableCallback((message: string) => {
    if (startRef.current === 0) {
      startRef.current = performance.now();
    }
    const seconds = ((performance.now() - startRef.current) / 1000).toFixed(2);
    setEntries((previous) => [`${seconds}s  ${message}`, ...previous].slice(0, 16));
  });

  React.useEffect(() => {
    function report(element: Element | null) {
      let message = describeElement(element);
      if (element && element !== document.body) {
        if (element.matches(':focus-visible')) {
          message += '  [focus-visible]';
        }
        if (element.closest('[inert]')) {
          message += '  ⚠ INSIDE INERT SUBTREE';
        }
      }
      setActiveLabel(message);
      log(`focus → ${message}`);
    }

    function handleFocusIn(event: FocusEvent) {
      report(event.target as Element);
    }

    function handleFocusOut(event: FocusEvent) {
      if (event.relatedTarget == null) {
        // Focus moved to the body, or the focused element is being removed. Let the browser
        // settle before reading `activeElement`.
        queueMicrotask(() => {
          if (document.activeElement === document.body) {
            report(document.body);
          }
        });
      }
    }

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, [log]);

  return { entries, activeLabel, log };
}

function resolveFinalFocus(setting: string, targetRef: React.RefObject<HTMLElement | null>) {
  switch (setting) {
    case FINAL_FOCUS[1]:
      return targetRef;
    case FINAL_FOCUS[2]:
      return () => true;
    case FINAL_FOCUS[3]:
      return () => null;
    case FINAL_FOCUS[4]:
      return false;
    default:
      return undefined;
  }
}

export default function PopupFocusReturn() {
  const { settings } = useExperimentSettings<Settings>();
  const { entries, activeLabel, log } = useFocusLog();
  const [closeSignal, setCloseSignal] = React.useState(0);
  const finalFocusTargetRef = React.useRef<HTMLButtonElement | null>(null);

  const contextValue = React.useMemo<ExperimentContextValue>(
    () => ({
      closeSignal,
      log,
      finalFocus: resolveFinalFocus(settings.finalFocus, finalFocusTargetRef),
      exitStyle: { '--exit-duration': `${settings.exitDuration}ms` } as React.CSSProperties,
      nested: settings.nestedPopover,
    }),
    [closeSignal, log, settings.finalFocus, settings.exitDuration, settings.nestedPopover],
  );

  return (
    <ExperimentContext.Provider value={contextValue}>
      <div className={styles.Page}>
        <h1 className={styles.Title}>popup-focus-return</h1>
        <p className={styles.Description}>
          Open a popup, then close it (Escape, outside click, Tab out, item selection) and watch
          where focus goes. With a long exit animation, press Tab while a popup is still fading out:
          the closing popup must be skipped. Turn on controlled mode to refuse or defer close
          requests, then close everything through the <code>open</code> prop.
        </p>

        <div className={styles.Toolbar}>
          <button type="button" className={styles.Button}>
            Before
          </button>
          <button
            type="button"
            className={styles.Button}
            onClick={() => {
              log('closing everything through the open prop');
              setCloseSignal((value) => value + 1);
            }}
            disabled={!settings.controlled}
            title={settings.controlled ? undefined : 'Enable "Controlled open" first'}
          >
            Close all by prop
          </button>
          <button type="button" className={styles.Button} ref={finalFocusTargetRef}>
            finalFocus target
          </button>
        </div>

        {/* Popups must not switch between controlled and uncontrolled, so remount them. */}
        <div className={styles.Grid} key={String(settings.controlled)}>
          <PopoverCard title="Popover" note="modal={false} · click" />
          <PopoverCard title="Popover modal" note="modal · click" modal />
          <PopoverCard
            title="Popover trap-focus"
            note="modal='trap-focus' · click"
            modal="trap-focus"
          />
          <PopoverCard
            title="Popover hover"
            note="openOnHover · focus manager off while hover-opened"
            openOnHover
          />
          <MenuCard title="Menu" note="click" />
          <MenuCard
            title="Menu hover"
            note="openOnHover · pulls focus into the popup"
            openOnHover
          />
          <SelectCard title="Select" note="modal (default)" />
          <SelectCard title="Select non-modal" note="modal={false}" modal={false} />
          <ComboboxOutsideCard />
          <ComboboxInsideCard />
          <DialogCard title="Dialog" note="modal" />
          <DialogCard title="Dialog non-modal" note="modal={false}" modal={false} />
          <AlertDialogCard />
          <DrawerCard />
          <PreviewCardCard />
        </div>

        <div className={styles.Toolbar}>
          <button type="button" className={styles.Button}>
            After
          </button>
        </div>

        <section className={styles.Log} aria-live="polite">
          <div className={styles.LogActive}>
            active element: <strong>{activeLabel}</strong>
          </div>
          <ol className={styles.LogList}>
            {entries.map((entry, index) => (
              // The log is prepend-only and capped, so the index is a stable enough key here.
              <li key={index} className={entry.includes('⚠') ? styles.LogWarn : undefined}>
                {entry}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </ExperimentContext.Provider>
  );
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

function NestedPopover(props: { parent: string }) {
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);
  return (
    <Popover.Root modal={false}>
      <Popover.Trigger className={styles.Button}>Nested popover</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup} finalFocus={finalFocus} style={exitStyle}>
            <div className={styles.Body}>
              <div className={styles.BodyTitle}>Nested in {props.parent}</div>
              <button type="button" className={styles.Button}>
                Nested A
              </button>
              <Popover.Close className={styles.Button}>Close nested</Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Body(props: { parent: string; children?: React.ReactNode }) {
  const { nested } = React.useContext(ExperimentContext);
  return (
    <div className={styles.Body}>
      <div className={styles.BodyTitle}>{props.parent}</div>
      <button type="button" className={styles.Button}>
        Inside A
      </button>
      <button type="button" className={styles.Button}>
        Inside B
      </button>
      {nested && <NestedPopover parent={props.parent} />}
      {props.children}
    </div>
  );
}

function PopoverCard(props: {
  title: string;
  note: string;
  modal?: boolean | 'trap-focus';
  openOnHover?: boolean;
}) {
  const { title, note, modal = false, openOnHover = false } = props;
  const control = usePopupControl(title);
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Popover.Root modal={modal} {...control}>
        <Popover.Trigger className={styles.Button} openOnHover={openOnHover} delay={100}>
          {title}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup} finalFocus={finalFocus} style={exitStyle}>
              <Body parent={title}>
                <Popover.Close className={styles.Button}>Close</Popover.Close>
              </Body>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Card>
  );
}

function MenuCard(props: { title: string; note: string; openOnHover?: boolean }) {
  const { title, note, openOnHover = false } = props;
  const control = usePopupControl(title);
  const { finalFocus, exitStyle, log } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Menu.Root {...control}>
        <Menu.Trigger className={styles.Button} openOnHover={openOnHover} delay={100}>
          {title}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8}>
            <Menu.Popup
              className={`${styles.Popup} ${styles.ListPopup}`}
              finalFocus={finalFocus}
              style={exitStyle}
            >
              <Menu.Item className={styles.Item} onClick={() => log(`${title}: item selected`)}>
                Select and close
              </Menu.Item>
              <Menu.Item className={styles.Item} closeOnClick={false}>
                Stay open
              </Menu.Item>
              <Menu.Item className={styles.Item}>Another item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Card>
  );
}

function SelectCard(props: { title: string; note: string; modal?: boolean }) {
  const { title, note, modal = true } = props;
  const control = usePopupControl(title);
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Select.Root modal={modal} {...control}>
        <Select.Trigger className={styles.Button}>
          {title}: <Select.Value placeholder="none" />
          <Select.Icon className={styles.Icon}>▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={8}>
            <Select.Popup
              className={`${styles.Popup} ${styles.ListPopup}`}
              finalFocus={finalFocus}
              style={exitStyle}
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
    </Card>
  );
}

function ComboboxOutsideCard() {
  const title = 'Combobox';
  const control = usePopupControl(title);
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="input outside the popup · typeable, non-modal">
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
              style={exitStyle}
            >
              <Combobox.Empty className={styles.Empty}>No fruit</Combobox.Empty>
              <Combobox.List>
                {(fruit: string) => (
                  <Combobox.Item key={fruit} value={fruit} className={styles.Item}>
                    {fruit}
                  </Combobox.Item>
                )}
              </Combobox.List>
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
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="input inside the popup · modal · goes inert with the popup">
      <Combobox.Root items={fruits} modal {...control}>
        <Combobox.Trigger className={styles.Button}>
          {title}: <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={8}>
            <Combobox.Popup
              className={`${styles.Popup} ${styles.ListPopup}`}
              finalFocus={finalFocus}
              style={exitStyle}
            >
              <div className={styles.PopupInputWrap}>
                <Combobox.Input className={styles.Input} placeholder="Search fruits" />
              </div>
              <Combobox.Empty className={styles.Empty}>No fruit</Combobox.Empty>
              <Combobox.List>
                {(fruit: string) => (
                  <Combobox.Item key={fruit} value={fruit} className={styles.Item}>
                    {fruit}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Card>
  );
}

function DialogCard(props: { title: string; note: string; modal?: boolean }) {
  const { title, note, modal = true } = props;
  const control = usePopupControl(title);
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note={note}>
      <Dialog.Root modal={modal} {...control}>
        <Dialog.Trigger className={styles.Button}>{title}</Dialog.Trigger>
        <Dialog.Portal>
          {modal && <Dialog.Backdrop className={styles.Backdrop} style={exitStyle} />}
          <Dialog.Popup className={styles.DialogPopup} finalFocus={finalFocus} style={exitStyle}>
            <Dialog.Title className={styles.BodyTitle}>{title}</Dialog.Title>
            <Body parent={title}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
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
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="modal · no outside-press dismissal">
      <AlertDialog.Root {...control}>
        <AlertDialog.Trigger className={styles.Button}>{title}</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.Backdrop} style={exitStyle} />
          <AlertDialog.Popup
            className={styles.DialogPopup}
            finalFocus={finalFocus}
            style={exitStyle}
          >
            <AlertDialog.Title className={styles.BodyTitle}>{title}</AlertDialog.Title>
            <Body parent={title}>
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
  const { finalFocus, exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="modal · swipe to dismiss stays interactive">
      <Drawer.Root swipeDirection="right" {...control}>
        <Drawer.Trigger className={styles.Button}>{title}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} style={exitStyle} />
          <Drawer.Viewport className={styles.DrawerViewport}>
            <Drawer.Popup className={styles.DrawerPopup} finalFocus={finalFocus} style={exitStyle}>
              <Drawer.Content className={styles.DrawerContent}>
                <Drawer.Title className={styles.BodyTitle}>{title}</Drawer.Title>
                <Body parent={title}>
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
  const { exitStyle } = React.useContext(ExperimentContext);

  return (
    <Card title={title} note="hover / focus on a link · links inside go inert on close">
      <PreviewCard.Root {...control}>
        <PreviewCard.Trigger href="#preview" className={styles.Link}>
          {title}
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner sideOffset={8}>
            <PreviewCard.Popup className={styles.Popup} style={exitStyle}>
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
