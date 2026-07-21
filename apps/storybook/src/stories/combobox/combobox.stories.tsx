import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from './combobox.module.css';

/**
 * Stories follow research/c-components/combobox (Tier 1): the kept docs demos
 * (hero, multiple+chips, grouped, async single/multiple, creatable, virtualized,
 * input-inside-popup), one story per documented behavior (filtering, useFilter,
 * useFilteredItems, empty state, chips keyboard flow, object values, grid, inline,
 * clearing, forms, animation), and the required full open→filter→select→close
 * interaction story. The virtualized story hand-rolls windowing because this
 * Storybook has no @tanstack/react-virtual dependency (the docs demo uses it).
 */
const meta = {
  title: 'Form inputs/Combobox',
  component: Combobox.Root,
  subcomponents: {
    'Combobox.Label': Combobox.Label,
    'Combobox.Value': Combobox.Value,
    'Combobox.Input': Combobox.Input,
    'Combobox.InputGroup': Combobox.InputGroup,
    'Combobox.Trigger': Combobox.Trigger,
    'Combobox.Icon': Combobox.Icon,
    'Combobox.Clear': Combobox.Clear,
    'Combobox.Chips': Combobox.Chips,
    'Combobox.Chip': Combobox.Chip,
    'Combobox.ChipRemove': Combobox.ChipRemove,
    'Combobox.Portal': Combobox.Portal,
    'Combobox.Positioner': Combobox.Positioner,
    'Combobox.Popup': Combobox.Popup,
    'Combobox.Status': Combobox.Status,
    'Combobox.Empty': Combobox.Empty,
    'Combobox.List': Combobox.List,
    'Combobox.Row': Combobox.Row,
    'Combobox.Item': Combobox.Item,
    'Combobox.ItemIndicator': Combobox.ItemIndicator,
    'Combobox.Group': Combobox.Group,
    'Combobox.GroupLabel': Combobox.GroupLabel,
    'Combobox.Collection': Combobox.Collection,
  },
} satisfies Meta<typeof Combobox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared data + local building blocks                                 */
/* ------------------------------------------------------------------ */

interface Fruit {
  value: string;
  label: string;
}

const fruits: Fruit[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'pineapple', label: 'Pineapple' },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'blackberry', label: 'Blackberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'peach', label: 'Peach' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'watermelon', label: 'Watermelon' },
];

const kiwi = fruits.find((fruit) => fruit.value === 'kiwi') ?? fruits[0];

interface Lang {
  value: string;
  label: string;
}

const langs: Lang[] = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
  { value: 'rb', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];

interface Person {
  id: string;
  name: string;
}

const scientists: Person[] = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
  { id: 'katherine', name: 'Katherine Johnson' },
  { id: 'radia', name: 'Radia Perlman' },
];

/**
 * Standard hero-styled anatomy shared by the behavior stories: input outside the
 * popup, caret trigger and (conditionally mounted) clear button in an InputGroup.
 */
function DemoCombobox({
  label,
  placeholder,
  items = fruits,
  root,
  popupClassName = styles.Popup,
}: {
  label: string;
  placeholder?: string;
  items?: Fruit[];
  root?: Partial<Combobox.Root.Props<Fruit, false>>;
  popupClassName?: string;
}) {
  const id = React.useId();
  return (
    <Combobox.Root items={items} {...root}>
      <div className={styles.Label}>
        <label htmlFor={id}>{label}</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder={placeholder} id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Clear className={styles.Clear} aria-label="Clear selection">
              <XIcon />
            </Combobox.Clear>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={popupClassName}>
            <Combobox.Empty>
              <div className={styles.Empty}>No fruits found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(item: Fruit) => (
                <Combobox.Item key={item.value} value={item} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{item.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** Chips anatomy for multiple selection (adapted from the docs "Multiple select" demo). */
function ChipsCombobox({ root }: { root?: Partial<Combobox.Root.Props<Lang, true>> }) {
  const id = React.useId();
  return (
    <Combobox.Root items={langs} multiple {...root}>
      <div className={styles.Label}>
        <label htmlFor={id}>Languages</label>
        <Combobox.InputGroup className={styles.ChipsInputGroup}>
          <Combobox.Chips className={styles.Chips}>
            <Combobox.Value>
              {(value: Lang[]) => (
                <React.Fragment>
                  {value.map((lang) => (
                    <Combobox.Chip key={lang.value} className={styles.Chip} aria-label={lang.label}>
                      {lang.label}
                      <Combobox.ChipRemove
                        className={styles.ChipRemove}
                        aria-label={`Remove ${lang.label}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'e.g. TypeScript'}
                    className={styles.ChipsInput}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No languages found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(lang: Lang) => (
                <Combobox.Item key={lang.value} value={lang} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{lang.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Hero + the full interaction contract                                */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a labeled input filtering a fruit list, with a caret trigger and a clear button that mounts only while a value is selected. Use as the starting point for choosing one predefined value from a large list. */
// The combobox demos render both a Combobox.Input and a Combobox.Trigger; in the production
// build the trigger also exposes role="combobox", so getByRole("combobox") is ambiguous there.
// Always target the text <input>.
function comboboxInput(scope: { getAllByRole(role: string): HTMLElement[] }): HTMLInputElement {
  const all = scope.getAllByRole('combobox');
  return (all.find((el) => el instanceof HTMLInputElement) ?? all[0]) as HTMLInputElement;
}

export const Hero: Story = {
  render: () => <DemoCombobox label="Choose a fruit" placeholder="e.g. Apple" />,
};

/** Dark-theme variant of Hero (Chromatic coverage of the dark semantic layer). */
export const Dark: Story = {
  ...Hero,
  globals: { theme: 'dark' },
};

function OpenFilterSelectCloseExample() {
  const [lastChange, setLastChange] = React.useState('none yet');
  return (
    <div className={styles.Stack}>
      <DemoCombobox
        label="Choose a fruit"
        placeholder="e.g. Apple"
        root={{
          onValueChange: (value, eventDetails) =>
            setLastChange(`${value ? value.value : 'null'} (reason: ${eventDetails.reason})`),
        }}
      />
      <output className={styles.Output}>onValueChange: {lastChange}</output>
    </div>
  );
}

/** The full interaction contract in one story: click the input to open, type to filter, ArrowDown to highlight (virtual focus — DOM focus never leaves the input; the item is referenced by `aria-activedescendant`), Enter to commit, popup closes and `onValueChange` receives `(value, eventDetails)`. */
export const OpenFilterSelectClose: Story = {
  render: () => <OpenFilterSelectCloseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // Typing filters the list; only the berries remain.
    await userEvent.keyboard('berry');
    await waitFor(() =>
      expect(body.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument(),
    );
    const strawberry = await body.findByRole('option', { name: 'Strawberry' });

    // Virtual focus: the input keeps DOM focus, aria-activedescendant points at the item.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', strawberry.id));
    await expect(input).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(input).toHaveValue('Strawberry');
    await expect(canvas.getByText(/onValueChange: strawberry \(reason: .+\)/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Controlled state                                                    */
/* ------------------------------------------------------------------ */

function ControlledValueAndInputExample() {
  const [value, setValue] = React.useState<Fruit | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  return (
    <div className={styles.Stack}>
      <DemoCombobox
        label="Fruit"
        placeholder="e.g. Apple"
        root={{ value, onValueChange: setValue, inputValue, onInputValueChange: setInputValue }}
      />
      <div className={styles.Row}>
        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            setValue(kiwi);
            setInputValue(kiwi.label);
          }}
        >
          Select Kiwi
        </button>
        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            setValue(null);
            setInputValue('');
          }}
        >
          Clear (null)
        </button>
      </div>
      <output className={styles.Output}>value: {value ? value.value : 'null'}</output>
    </div>
  );
}

/** The two text-bearing state axes are controlled separately: `value`/`onValueChange` (the committed selection) and `inputValue`/`onInputValueChange` (the text). Programmatic changes update the field without mounting or opening the popup; clear with `null`. */
export const ControlledValueAndInput: Story = {
  render: () => <ControlledValueAndInputExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(canvas.getByRole('button', { name: 'Select Kiwi' }));
    await expect(input).toHaveValue('Kiwi');
    await expect(canvas.getByText('value: kiwi')).toBeVisible();
    // Programmatic value changes must not open the popup.
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear (null)' }));
    await expect(input).toHaveValue('');
    await expect(canvas.getByText('value: null')).toBeVisible();
  },
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <DemoCombobox
        label="Fruit"
        placeholder="e.g. Apple"
        root={{
          open,
          onOpenChange: (nextOpen, eventDetails) => {
            // Veto light dismissal so only explicit actions close the popup.
            if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
              eventDetails.cancel();
              setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
              return;
            }
            setOpen(nextOpen);
            setLog((entries) => [...entries, eventDetails.reason]);
          },
        }}
      />
      <button type="button" className={styles.Button}>
        Outside area
      </button>
      <output className={styles.Output}>reasons: {log.length > 0 ? log.join(', ') : 'none'}</output>
    </div>
  );
}

/** Use `open` + `onOpenChange` to control the popup. Every change request carries a typed `reason` — clicking the input reports `input-press`, distinct from `trigger-press` (#4015) — and `eventDetails.cancel()` vetoes the change, here keeping the popup open through outside presses. */
export const ControlledOpenWithEventDetails: Story = {
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(canvas.getByText(/input-press/)).toBeVisible();

    // Outside press is canceled by the handler, so the popup stays open.
    // (While open, content outside the combobox is aria-hidden, so query by text.)
    await userEvent.click(canvas.getByText('Outside area'));
    await expect(canvas.getByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(listbox).toBeVisible());

    // Escape is not canceled and closes the popup.
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByText(/escape-key/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

const cities = ['São Paulo', 'Zürich', 'Kraków', 'Reykjavík', 'Málaga', 'Montréal', 'New York'];

function UseFilterExample() {
  const { contains } = Combobox.useFilter();
  const id = React.useId();
  return (
    <Combobox.Root items={cities} filter={contains}>
      <div className={styles.Label}>
        <label htmlFor={id}>City</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Zurich" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No cities found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(city: string) => (
                <Combobox.Item key={city} value={city} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{city}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** `Combobox.useFilter()` exposes the same `Intl.Collator`-based matching the component uses internally (`contains`/`startsWith`/`endsWith`; case-, diacritic- and punctuation-insensitive). Pass one of them to the `filter` prop when building external filtering with identical semantics. */
export const ExternalFilterWithUseFilter: Story = {
  render: () => <UseFilterExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(comboboxInput(canvas));
    // Collator matching is diacritic-insensitive: "sao" matches "São Paulo".
    await userEvent.keyboard('sao');
    const match = await body.findByRole('option', { name: 'São Paulo' });
    await waitFor(() => expect(match).toBeVisible());
    await expect(body.queryByRole('option', { name: 'Zürich' })).not.toBeInTheDocument();
  },
};

function FilteredCount() {
  const filteredItems = Combobox.useFilteredItems<Fruit>();
  return (
    <div className={styles.Status}>
      {filteredItems.length} of {fruits.length} rows would render
    </div>
  );
}

/** `Combobox.useFilteredItems()` reads the internal filter's output from inside `<Combobox.Root>` — the hook virtualizers use to derive their row count (see the Virtualized story for the full pattern, #3732). */
export const UseFilteredItemsForVirtualizer: Story = {
  render: () => {
    return (
      <Combobox.Root items={fruits}>
        <div className={styles.Label}>
          <label htmlFor="use-filtered-items-input">Fruit</label>
          <Combobox.InputGroup className={styles.InputGroup}>
            <Combobox.Input
              placeholder="e.g. Apple"
              id="use-filtered-items-input"
              className={styles.Input}
            />
            <div className={styles.ActionButtons}>
              <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Empty>
                <div className={styles.Empty}>No fruits found.</div>
              </Combobox.Empty>
              <Combobox.List className={styles.List}>
                {(item: Fruit) => (
                  <Combobox.Item key={item.value} value={item} className={styles.Item}>
                    <Combobox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={styles.ItemText}>{item.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
              <FilteredCount />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  },
};

/** `Combobox.Empty` renders its children only when the filtered list is empty (it requires the `items` prop). It is a polite live region (`role="status"`) that must stay mounted — conditionally render its children, not the part itself. */
export const EmptyState: Story = {
  render: () => <DemoCombobox label="Fruit" placeholder="e.g. Apple" />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(comboboxInput(canvas));
    await userEvent.keyboard('zzz');

    const empty = await body.findByText('No fruits found.');
    await waitFor(() => expect(empty).toBeVisible());
    // The Empty part is a polite live region so the miss gets announced.
    await expect(body.getByRole('status')).toBeVisible();
    await expect(body.queryByRole('option')).not.toBeInTheDocument();
  },
};

/** `autoHighlight` keeps the first match highlighted while filtering, so Enter selects it immediately; the default (`false`) follows the APG stance of never highlighting without an explicit arrow key. */
export const AutoHighlightModes: Story = {
  render: () => (
    <div className={styles.Row}>
      <DemoCombobox label="autoHighlight" placeholder="Type ba…" root={{ autoHighlight: true }} />
      <DemoCombobox label="Default" placeholder="Type ba…" />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const [autoInput, plainInput] = canvas
      .getAllByRole('combobox')
      .filter((el) => el instanceof HTMLInputElement);

    await userEvent.click(autoInput);
    await userEvent.keyboard('ba');
    // The first match is highlighted automatically while typing.
    await waitFor(() =>
      expect(doc.querySelector('[role="option"][data-highlighted]')).toHaveTextContent('Banana'),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(autoInput).toHaveAttribute('aria-expanded', 'false'));

    await userEvent.click(plainInput);
    await userEvent.keyboard('ba');
    await within(doc.body).findByRole('option', { name: 'Banana' });
    // Default mode: typing never highlights an item on its own.
    await expect(doc.querySelector('[role="option"][data-highlighted]')).not.toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/* Multiple selection & chips                                          */
/* ------------------------------------------------------------------ */

/** The kept docs "Multiple select" demo: `multiple` turns the value into an array and the `Chips`/`Chip`/`ChipRemove` anatomy renders tokenized selections around the input, mapped through the `Combobox.Value` render prop. */
export const MultipleSelectionChips: Story = {
  render: () => <ChipsCombobox />,
};

function ChipsKeyboardExample() {
  const [value, setValue] = React.useState<Lang[]>([langs[0], langs[1], langs[2]]);
  return (
    <div className={styles.Stack}>
      <ChipsCombobox root={{ value, onValueChange: setValue }} />
      <output className={styles.Output}>{value.length} selected</output>
    </div>
  );
}

/** The chips keyboard contract: with the caret at the start of the input, ArrowLeft moves real DOM focus onto the chips (unlike list items, chips are DOM-focused), Backspace removes the focused chip, and the chips container takes `role="toolbar"` so NVDA passes arrow keys through (#3629/#3647). */
export const ChipsKeyboardFlow: Story = {
  render: () => <ChipsKeyboardExample />,
  play: async ({ canvas, userEvent }) => {
    const input = comboboxInput(canvas);
    // The chips container becomes role="toolbar" while chips exist.
    await expect(canvas.getByRole('toolbar')).toBeVisible();
    await expect(canvas.getByText('3 selected')).toBeVisible();

    await userEvent.click(input);
    await userEvent.keyboard('{ArrowLeft}');
    // Real DOM focus lands on the last chip.
    await waitFor(() => expect(canvas.getByLabelText('Python')).toHaveFocus());

    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(canvas.queryByLabelText('Python')).not.toBeInTheDocument());
    await expect(await canvas.findByText('2 selected')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Object values                                                       */
/* ------------------------------------------------------------------ */

function PersonAnatomy({ root }: { root?: Partial<Combobox.Root.Props<Person, false>> }) {
  const id = React.useId();
  return (
    <Combobox.Root
      items={scientists}
      itemToStringLabel={(person: Person) => person.name}
      isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
      {...root}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Scientist</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Ada" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No scientists found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(person: Person) => (
                <Combobox.Item key={person.id} value={person} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{person.name}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function IsItemEqualToValueExample() {
  // A fresh clone: referential equality with the items array never holds.
  const [value, setValue] = React.useState<Person | null>({ ...scientists[1] });
  return (
    <div className={styles.Stack}>
      <PersonAnatomy root={{ value, onValueChange: setValue }} />
      <button
        type="button"
        className={styles.Button}
        onClick={() => setValue({ ...scientists[1] })}
      >
        Rehydrate from server copy
      </button>
      <output className={styles.Output}>value id: {value ? value.id : 'null'}</output>
    </div>
  );
}

/** Object values that arrive from a server or form library are never referentially identical to the `items` — `isItemEqualToValue` (here comparing `id`) keeps the selection matched, and `itemToStringLabel` resolves the input text. Without it the selection silently drops (defaults to `Object.is`). */
export const IsItemEqualToValueObjects: Story = {
  render: () => <IsItemEqualToValueExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    // The label resolves even though the value is a clone of the item.
    await expect(input).toHaveValue('Grace Hopper');

    await userEvent.click(canvas.getByRole('button', { name: 'Rehydrate from server copy' }));
    await userEvent.click(input);
    const option = await body.findByRole('option', { name: 'Grace Hopper' });
    await waitFor(() => expect(option).toHaveAttribute('aria-selected', 'true'));
  },
};

function FormSerializationExample() {
  const [payload, setPayload] = React.useState<string | null>(null);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPayload(`scientist=${String(data.get('scientist'))}`);
      }}
    >
      <PersonAnatomy root={{ name: 'scientist', itemToStringValue: (person) => person.id }} />
      <button type="submit" className={styles.Button}>
        Submit
      </button>
      {payload ? <output className={styles.Output}>{payload}</output> : null}
    </form>
  );
}

/** A visually-hidden `<input>` inside Root carries the serialized value into native form submission: `itemToStringValue` controls the payload for object values (`{ value, label }` shapes serialize automatically), `itemToStringLabel` the visible text. */
export const ObjectValuesStringification: Story = {
  render: () => <FormSerializationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(comboboxInput(canvas));
    await userEvent.click(await body.findByRole('option', { name: 'Ada Lovelace' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await expect(await canvas.findByText('scientist=ada')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Clearing                                                            */
/* ------------------------------------------------------------------ */

/** `Combobox.Clear` mounts only while a value is selected and is deliberately not tabbable ("one tab stop per field", #3630) — keyboard users clear with Escape while the popup is closed, or Delete. */
export const ClearableSelection: Story = {
  render: () => (
    <DemoCombobox label="Fruit" placeholder="e.g. Apple" root={{ defaultValue: fruits[0] }} />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);
    await expect(input).toHaveValue('Apple');

    const clear = canvas.getByRole('button', { name: 'Clear selection' });
    // Not tabbable by design: Esc/Delete are the keyboard path.
    await expect(clear).toHaveAttribute('tabindex', '-1');
    await userEvent.click(clear);
    await waitFor(() => expect(input).toHaveValue(''));

    // Select again, then clear with Escape while the popup is closed.
    await userEvent.click(input);
    await userEvent.click(await body.findByRole('option', { name: 'Banana' }));
    await waitFor(() => expect(input).toHaveValue('Banana'));
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveValue(''));
  },
};

/* ------------------------------------------------------------------ */
/* Structure: groups, grid, input placement, inline                    */
/* ------------------------------------------------------------------ */

interface Produce {
  value: string;
  label: string;
}

interface ProduceGroup {
  value: string;
  items: Produce[];
}

const groupedProduce: ProduceGroup[] = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
];

/** The kept docs "Grouped" demo: a grouped `items` array feeds `Group` (with its own `items`) + auto-associated `GroupLabel`, and `Collection` renders the filtered items because a wrapper sits between `List` and the items. */
export const GroupedItems: Story = {
  render: () => {
    return (
      <Combobox.Root items={groupedProduce}>
        <div className={styles.Label}>
          <label htmlFor="grouped-produce-input">Select produce</label>
          <Combobox.InputGroup className={styles.InputGroup}>
            <Combobox.Input
              placeholder="e.g. Mango"
              id="grouped-produce-input"
              className={styles.Input}
            />
            <div className={styles.ActionButtons}>
              <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.Empty>
                <div className={styles.Empty}>No produce found.</div>
              </Combobox.Empty>
              <Combobox.List className={styles.List}>
                {(group: ProduceGroup) => (
                  <Combobox.Group key={group.value} items={group.items} className={styles.Group}>
                    <Combobox.GroupLabel className={styles.GroupLabel}>
                      {group.value}
                    </Combobox.GroupLabel>
                    <Combobox.Collection>
                      {(item: Produce) => (
                        <Combobox.Item key={item.value} value={item} className={styles.Item}>
                          <Combobox.ItemIndicator className={styles.ItemIndicator}>
                            <CheckIcon />
                          </Combobox.ItemIndicator>
                          <span className={styles.ItemText}>{item.label}</span>
                        </Combobox.Item>
                      )}
                    </Combobox.Collection>
                  </Combobox.Group>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  },
};

const emojis = [
  '😀',
  '😅',
  '🤣',
  '😍',
  '😎',
  '😭',
  '😡',
  '👍',
  '👎',
  '🙏',
  '💪',
  '🔥',
  '⭐',
  '🌈',
  '🍕',
  '🍎',
];

function EmojiRows() {
  const filteredItems = Combobox.useFilteredItems<string>();
  const rows: string[][] = [];
  for (let i = 0; i < filteredItems.length; i += 4) {
    rows.push(filteredItems.slice(i, i + 4));
  }
  return (
    <React.Fragment>
      {rows.map((row) => (
        <Combobox.Row key={row.join('')} className={styles.GridRow}>
          {row.map((emoji) => (
            <Combobox.Item key={emoji} value={emoji} className={styles.GridItem}>
              {emoji}
            </Combobox.Item>
          ))}
        </Combobox.Row>
      ))}
    </React.Fragment>
  );
}

function GridExample() {
  const id = React.useId();
  return (
    <Combobox.Root grid items={emojis}>
      <div className={styles.Label}>
        <label htmlFor={id}>Emoji</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="Pick an emoji" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.List className={styles.List}>
              <EmojiRows />
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The emoji-picker layout: `grid` on Root plus `Row` wrappers switch navigation to two dimensions (columns are inferred from the rendered rows, #2683) and emit grid/row ARIA roles. Arrow keys move the virtual highlight across and down. */
export const GridLayout: Story = {
  render: () => <GridExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(comboboxInput(canvas));
    const grid = await body.findByRole('grid');
    await waitFor(() => expect(grid).toBeVisible());

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(doc.querySelector('[data-highlighted]')).toHaveTextContent('😀'));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(doc.querySelector('[data-highlighted]')).toHaveTextContent('😅'));
  },
};

const countries = ['France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Ireland', 'Japan', 'Spain'];

/** The kept docs "Input inside popup" demo (searchable select): the trigger is the form control and takes `role="combobox"` (#2973), the popup becomes `role="dialog"` (#3213), and `Combobox.Label` labels the trigger since a native `<label>` cannot. */
export const InputInsidePopup: Story = {
  render: () => (
    <div className={styles.Field}>
      <Combobox.Root items={countries}>
        <Combobox.Label className={styles.Label}>Country</Combobox.Label>
        <Combobox.Trigger className={styles.SelectTrigger}>
          <Combobox.Value placeholder="Select country" />
          <Combobox.Icon className={styles.TriggerIcon}>
            <CaretUpDownIcon />
          </Combobox.Icon>
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} align="start" sideOffset={4}>
            <Combobox.Popup className={styles.PopupWithInput} aria-label="Select country">
              <Combobox.Input placeholder="e.g. Germany" className={styles.PopupInput} />
              <Combobox.Empty>
                <div className={styles.Empty}>No countries found.</div>
              </Combobox.Empty>
              <Combobox.List className={styles.List}>
                {(country: string) => (
                  <Combobox.Item key={country} value={country} className={styles.Item}>
                    <Combobox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={styles.ItemText}>{country}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = comboboxInput(canvas);

    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const input = within(dialog).getByPlaceholderText('e.g. Germany');
    await waitFor(() => expect(input).toHaveFocus());

    await userEvent.keyboard('ger');
    await userEvent.click(await within(dialog).findByRole('option', { name: 'Germany' }));
    await waitFor(() => expect(trigger).toHaveTextContent('Germany'));
  },
};

function InlineAnatomy({ root }: { root?: Partial<Combobox.Root.Props<Fruit, false>> }) {
  const id = React.useId();
  return (
    <Combobox.Root items={fruits} inline open {...root}>
      <div className={styles.Label}>
        <label htmlFor={id}>Fruit</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Apple" id={id} className={styles.Input} />
        </Combobox.InputGroup>
      </div>
      <div className={styles.InlineListBox}>
        <Combobox.Empty>
          <div className={styles.Empty}>No fruits found.</div>
        </Combobox.Empty>
        <Combobox.List className={styles.InlineList}>
          {(item: Fruit) => (
            <Combobox.Item key={item.value} value={item} className={styles.Item}>
              <Combobox.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon />
              </Combobox.ItemIndicator>
              <span className={styles.ItemText}>{item.label}</span>
            </Combobox.Item>
          )}
        </Combobox.List>
      </div>
    </Combobox.Root>
  );
}

/** `inline` renders the list in normal document flow with no Portal/Positioner/Popup — `open` must be passed unconditionally (`<Combobox.Root inline open>`, documented in #5069). Filtering updates the list in place. */
export const InlineNoPopup: Story = {
  render: () => <InlineAnatomy />,
  play: async ({ canvas, userEvent }) => {
    // The listbox renders in-flow, inside the story canvas — not on document.body.
    const listbox = canvas.getByRole('listbox');
    await expect(listbox).toBeVisible();

    await userEvent.click(comboboxInput(canvas));
    await userEvent.keyboard('ban');
    await waitFor(() =>
      expect(canvas.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole('option', { name: 'Banana' })).toBeVisible();
  },
};

function InlineDialogExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={styles.Button}>Pick a fruit</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.DialogPopup}>
          <Dialog.Title className={styles.DialogTitle}>Pick a fruit</Dialog.Title>
          {/* Bind the combobox's open state to the dialog's so transient state
              (query, highlight, input value) resets when the dialog closes. */}
          <InlineAnatomy root={{ open, onOpenChange: setOpen }} />
          <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The documented Dialog composition (#5069/#3966): an inline combobox inside `Dialog.Popup`, with the combobox `open` bound to the dialog's, so closing the dialog resets the query, highlight, and input value. */
export const InlineInsideDialog: Story = {
  render: () => <InlineDialogExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Pick a fruit' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    const input = within(dialog).getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('ban');
    await waitFor(() =>
      expect(within(dialog).queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument(),
    );

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    // Reopening shows a reset combobox: empty input, unfiltered list.
    await userEvent.click(canvas.getByRole('button', { name: 'Pick a fruit' }));
    const reopenedDialog = await body.findByRole('dialog');
    await expect(within(reopenedDialog).getByRole('combobox')).toHaveValue('');
    await expect(
      await within(reopenedDialog).findByRole('option', { name: 'Apple' }),
    ).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Async search                                                        */
/* ------------------------------------------------------------------ */

interface Contributor {
  id: string;
  name: string;
  role: string;
}

const contributors: Contributor[] = [
  { id: 'leslie', name: 'Leslie Alexander', role: 'Product Manager' },
  { id: 'kathryn', name: 'Kathryn Murphy', role: 'Marketing Lead' },
  { id: 'courtney', name: 'Courtney Henry', role: 'Design Systems' },
  { id: 'michael', name: 'Michael Foster', role: 'Engineering Manager' },
  { id: 'lindsay', name: 'Lindsay Walton', role: 'Product Designer' },
  { id: 'tom', name: 'Tom Cook', role: 'Frontend Engineer' },
  { id: 'whitney', name: 'Whitney Francis', role: 'Customer Success' },
];

function ContributorItem({ contributor }: { contributor: Contributor }) {
  return (
    <Combobox.Item key={contributor.id} value={contributor} className={styles.Item}>
      <Combobox.ItemIndicator className={styles.ItemIndicator}>
        <CheckIcon />
      </Combobox.ItemIndicator>
      <span className={styles.ItemText}>
        <span className={styles.ItemLabel}>{contributor.name}</span>
        <span className={styles.ItemDescription}>{contributor.role}</span>
      </span>
    </Combobox.Item>
  );
}

function AsyncSingleExample() {
  const id = React.useId();
  const [results, setResults] = React.useState<Contributor[]>([]);
  const [value, setValue] = React.useState<Contributor | null>(null);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const timeout = useTimeout();
  const { contains } = Combobox.useFilter();

  // Keep the selected value inside `items` so it never disappears between searches.
  const items = React.useMemo(() => {
    if (!value || results.some((contributor) => contributor.id === value.id)) {
      return results;
    }
    return [...results, value];
  }, [results, value]);

  const trimmed = query.trim();
  let status: React.ReactNode = null;
  if (pending) {
    status = (
      <React.Fragment>
        <span className={styles.Spinner} aria-hidden />
        Searching…
      </React.Fragment>
    );
  } else if (trimmed === '' && !value) {
    status = 'Start typing to search contributors…';
  }

  return (
    <Combobox.Root
      items={items}
      value={value}
      filter={null}
      itemToStringLabel={(contributor: Contributor) => contributor.name}
      isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
      onValueChange={(next) => {
        setValue(next);
        setQuery('');
      }}
      onInputValueChange={(next, eventDetails) => {
        setQuery(next);
        if (eventDetails.reason === 'item-press') {
          return;
        }
        timeout.clear();
        if (next.trim() === '') {
          setResults([]);
          setPending(false);
          return;
        }
        setPending(true);
        // Simulated network latency; a real app would fetch here.
        timeout.start(300, () => {
          setResults(
            contributors.filter(
              (contributor) => contains(contributor.name, next) || contains(contributor.role, next),
            ),
          );
          setPending(false);
        });
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Assign reviewer</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Michael" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Clear className={styles.Clear} aria-label="Clear selection">
              <XIcon />
            </Combobox.Clear>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup} aria-busy={pending || undefined}>
            <Combobox.Status>
              {status ? <div className={styles.Status}>{status}</div> : null}
            </Combobox.Status>
            <Combobox.Empty>
              {trimmed !== '' && !pending && results.length === 0 ? (
                <div className={styles.Empty}>No matches for “{trimmed}”.</div>
              ) : null}
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(contributor: Contributor) => (
                <ContributorItem key={contributor.id} contributor={contributor} />
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The kept docs "Async search (single)" pattern: `filter={null}` turns internal filtering off, search results replace `items`, the selected value is merged back into `items` so it survives result changes, and `Combobox.Status` (a polite live region that must stay mounted) narrates the request lifecycle. */
export const AsyncSearchSingle: Story = {
  render: () => <AsyncSingleExample />,
};

function AsyncMultipleExample() {
  const id = React.useId();
  const [selected, setSelected] = React.useState<Contributor[]>([contributors[0]]);
  const [results, setResults] = React.useState<Contributor[]>([]);
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const timeout = useTimeout();
  const { contains } = Combobox.useFilter({ multiple: true });

  // `items` = everything known (selected + fetched) so values are never orphaned;
  // `filteredItems` = only the current search results (external filtering, #3068).
  const items = React.useMemo(() => {
    const known = new Map(selected.map((contributor) => [contributor.id, contributor]));
    results.forEach((contributor) => known.set(contributor.id, contributor));
    return [...known.values()];
  }, [selected, results]);

  const filteredItems = query.trim() === '' ? selected : results;

  return (
    <Combobox.Root
      multiple
      items={items}
      filteredItems={filteredItems}
      value={selected}
      itemToStringLabel={(contributor: Contributor) => contributor.name}
      isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
      onValueChange={setSelected}
      onInputValueChange={(next, eventDetails) => {
        setQuery(next);
        if (eventDetails.reason === 'item-press') {
          return;
        }
        timeout.clear();
        if (next.trim() === '') {
          setResults([]);
          setPending(false);
          return;
        }
        setPending(true);
        timeout.start(300, () => {
          setResults(contributors.filter((contributor) => contains(contributor.name, next)));
          setPending(false);
        });
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Reviewers</label>
        <Combobox.InputGroup className={styles.ChipsInputGroup}>
          <Combobox.Chips className={styles.Chips}>
            <Combobox.Value>
              {(value: Contributor[]) => (
                <React.Fragment>
                  {value.map((contributor) => (
                    <Combobox.Chip
                      key={contributor.id}
                      className={styles.Chip}
                      aria-label={contributor.name}
                    >
                      {contributor.name}
                      <Combobox.ChipRemove
                        className={styles.ChipRemove}
                        aria-label={`Remove ${contributor.name}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'Search people…'}
                    className={styles.ChipsInput}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup} aria-busy={pending || undefined}>
            <Combobox.Status>
              {pending ? (
                <div className={styles.Status}>
                  <span className={styles.Spinner} aria-hidden />
                  Searching…
                </div>
              ) : null}
            </Combobox.Status>
            <Combobox.Empty>
              {query.trim() !== '' && !pending && results.length === 0 ? (
                <div className={styles.Empty}>No matches.</div>
              ) : null}
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(contributor: Contributor) => (
                <ContributorItem key={contributor.id} contributor={contributor} />
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The kept docs "Async search (multiple)" pattern, using the `filteredItems` prop (#3068): `items` holds everything known (selected + fetched) so chips survive result changes (#3824), while `filteredItems` hands the component only the current results. */
export const AsyncSearchMultiple: Story = {
  render: () => <AsyncMultipleExample />,
};

/* ------------------------------------------------------------------ */
/* Creatable                                                           */
/* ------------------------------------------------------------------ */

interface Flavor {
  creatable?: string;
  id: string;
  label: string;
}

const initialFlavors: Flavor[] = [
  { id: 'vanilla', label: 'Vanilla' },
  { id: 'chocolate', label: 'Chocolate' },
  { id: 'pistachio', label: 'Pistachio' },
];

function CreatableExample() {
  const id = React.useId();
  const [flavors, setFlavors] = React.useState<Flavor[]>(initialFlavors);
  const [selected, setSelected] = React.useState<Flavor | null>(null);
  const [query, setQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pendingLabel, setPendingLabel] = React.useState('');

  const trimmed = query.trim();
  const exactExists = flavors.some(
    (flavor) => flavor.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
  );
  const itemsForView: Flavor[] =
    trimmed !== '' && !exactExists
      ? [
          ...flavors,
          {
            creatable: trimmed,
            id: `create:${trimmed.toLocaleLowerCase()}`,
            label: `Create "${trimmed}"`,
          },
        ]
      : flavors;

  function handleCreate() {
    const label = pendingLabel.trim();
    if (label === '') {
      return;
    }
    const newItem: Flavor = { id: label.toLocaleLowerCase().replace(/\s+/g, '-'), label };
    setFlavors((previous) => [...previous, newItem]);
    setSelected(newItem);
    setQuery(label);
    setDialogOpen(false);
  }

  return (
    <React.Fragment>
      <Combobox.Root
        items={itemsForView}
        value={selected}
        inputValue={query}
        onInputValueChange={setQuery}
        isItemEqualToValue={(itemValue, current) => itemValue.id === current.id}
        itemToStringLabel={(flavor: Flavor) => flavor.label}
        onValueChange={(next) => {
          if (next && next.creatable) {
            setPendingLabel(next.creatable);
            setDialogOpen(true);
            return;
          }
          setSelected(next);
          setQuery(next ? next.label : '');
        }}
      >
        <div className={styles.Label}>
          <label htmlFor={id}>Flavor</label>
          <Combobox.InputGroup className={styles.InputGroup}>
            <Combobox.Input placeholder="e.g. Vanilla" id={id} className={styles.Input} />
            <div className={styles.ActionButtons}>
              <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
                <CaretDownIcon />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.List className={styles.List}>
                {(flavor: Flavor) => (
                  <Combobox.Item key={flavor.id} value={flavor} className={styles.Item}>
                    <Combobox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className={styles.ItemText}>{flavor.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.DialogPopup}>
            <Dialog.Title className={styles.DialogTitle}>Create flavor</Dialog.Title>
            <p className={styles.Description}>Add “{pendingLabel}” to the list?</p>
            <div className={styles.Row}>
              <button type="button" className={styles.Button} onClick={handleCreate}>
                Create
              </button>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

/** The kept docs "Creatable" pattern: when the query has no exact match, a synthetic `Create "…"` item is appended; picking it opens a confirmation Dialog instead of committing, and confirming appends the new item to `items` and selects it. */
export const CreatableEntries: Story = {
  render: () => <CreatableExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    await userEvent.keyboard('Tangerine');
    await userEvent.click(await body.findByRole('option', { name: 'Create "Tangerine"' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(input).toHaveValue('Tangerine');
  },
};

/* ------------------------------------------------------------------ */
/* Virtualization                                                      */
/* ------------------------------------------------------------------ */

interface BigItem {
  id: string;
  name: string;
}

const bigItems: BigItem[] = Array.from({ length: 1000 }, (_, index) => {
  const id = String(index + 1);
  return { id, name: `Item ${id.padStart(4, '0')}` };
});

const ROW_HEIGHT = 32;
const VIEWPORT_HEIGHT = 288; // matches .Scroller max-height (18rem)
const OVERSCAN = 6;

function WindowedList({ scrollerRef }: { scrollerRef: React.RefObject<HTMLDivElement | null> }) {
  const filteredItems = Combobox.useFilteredItems<BigItem>();
  const [scrollTop, setScrollTop] = React.useState(0);

  if (filteredItems.length === 0) {
    return null;
  }

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(
    filteredItems.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );

  return (
    <div
      role="presentation"
      ref={scrollerRef}
      className={styles.Scroller}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div
        role="presentation"
        style={{ height: filteredItems.length * ROW_HEIGHT, position: 'relative' }}
      >
        {filteredItems.slice(start, end).map((item, offset) => {
          const index = start + offset;
          return (
            <Combobox.Item
              key={item.id}
              index={index}
              value={item}
              className={styles.VirtualItem}
              aria-setsize={filteredItems.length}
              aria-posinset={index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: ROW_HEIGHT,
                transform: `translateY(${index * ROW_HEIGHT}px)`,
              }}
            >
              <Combobox.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon />
              </Combobox.ItemIndicator>
              <span className={styles.ItemText}>{item.name}</span>
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

function VirtualizedExample() {
  const id = React.useId();
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <Combobox.Root
      virtualized
      items={bigItems}
      itemToStringLabel={(item: BigItem) => item.name}
      onItemHighlighted={(item, eventDetails) => {
        const scroller = scrollerRef.current;
        if (!item || !scroller || eventDetails.reason === 'pointer') {
          return;
        }
        // Keep the keyboard highlight inside the window.
        const top = eventDetails.index * ROW_HEIGHT;
        if (top < scroller.scrollTop) {
          scroller.scrollTop = top;
        } else if (top + ROW_HEIGHT > scroller.scrollTop + scroller.clientHeight) {
          scroller.scrollTop = top + ROW_HEIGHT - scroller.clientHeight;
        }
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Search 1,000 items</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Item 0042" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No items found.</div>
            </Combobox.Empty>
            <Combobox.List>
              <WindowedList scrollerRef={scrollerRef} />
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** `virtualized` + `useFilteredItems` + per-item `index`/`aria-setsize`/`aria-posinset`: only the visible window of 1,000 items is mounted. The docs demo uses `@tanstack/react-virtual`; this Storybook hand-rolls fixed-height windowing to stay dependency-free. Virtualize beyond ~1,000 items because mount cost dominates opening (docs "Memoizing items"). */
export const Virtualized: Story = {
  render: () => <VirtualizedExample />,
};

/* ------------------------------------------------------------------ */
/* Disabled, read-only, forms                                          */
/* ------------------------------------------------------------------ */

/** `disabled` disables the whole control; `readOnly` keeps the value visible and submittable while blocking opening and editing (native `readonly` + `aria-readonly` on the input). */
export const DisabledAndReadOnly: Story = {
  render: () => (
    <div className={styles.Row}>
      <DemoCombobox label="Disabled" root={{ disabled: true, defaultValue: fruits[0] }} />
      <DemoCombobox label="Read-only" root={{ readOnly: true, defaultValue: fruits[1] }} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const [disabledInput, readOnlyInput] = canvas
      .getAllByRole('combobox')
      .filter((el) => el instanceof HTMLInputElement);

    await expect(disabledInput).toBeDisabled();

    await expect(readOnlyInput).toHaveValue('Banana');
    await expect(readOnlyInput).toHaveAttribute('readonly');
    await userEvent.click(readOnlyInput);
    await expect(readOnlyInput).toHaveAttribute('aria-expanded', 'false');
  },
};

function FieldValidationExample() {
  const [status, setStatus] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        setStatus('Submitted');
      }}
    >
      <Field.Root name="fruit" className={styles.Field}>
        <Combobox.Root items={fruits} required>
          <div className={styles.Label}>
            <Field.Label>Favorite fruit</Field.Label>
            <Combobox.InputGroup className={styles.InputGroup}>
              <Combobox.Input placeholder="e.g. Apple" className={styles.Input} />
              <div className={styles.ActionButtons}>
                <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
                  <CaretDownIcon />
                </Combobox.Trigger>
              </div>
            </Combobox.InputGroup>
          </div>
          <Combobox.Portal>
            <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
              <Combobox.Popup className={styles.Popup}>
                <Combobox.Empty>
                  <div className={styles.Empty}>No fruits found.</div>
                </Combobox.Empty>
                <Combobox.List className={styles.List}>
                  {(item: Fruit) => (
                    <Combobox.Item key={item.value} value={item} className={styles.Item}>
                      <Combobox.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon />
                      </Combobox.ItemIndicator>
                      <span className={styles.ItemText}>{item.label}</span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Field.Description className={styles.Description}>
          Only list entries are valid values.
        </Field.Description>
        <Field.Error className={styles.Error} match="valueMissing">
          Please choose a fruit.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** Inside `Field`/`Form`, the combobox participates in constraint validation through its hidden input: `required` blocks submission, `Field.Error` renders the message, and `data-invalid`/`data-touched`/`data-filled` land on the Input for styling. */
export const InFieldWithValidation: Story = {
  render: () => <FieldValidationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Please choose a fruit.')).toBeVisible();
    await expect(input).toHaveAttribute('data-invalid');

    await userEvent.click(input);
    await userEvent.click(await body.findByRole('option', { name: 'Cherry' }));
    await waitFor(() => expect(input).toHaveValue('Cherry'));

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Submitted')).toBeVisible();
    await expect(canvas.queryByText('Please choose a fruit.')).not.toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/* Animation                                                           */
/* ------------------------------------------------------------------ */

function AnimatedExample() {
  const [phase, setPhase] = React.useState('idle');
  return (
    <div className={styles.Stack}>
      <DemoCombobox
        label="Fruit"
        placeholder="e.g. Apple"
        popupClassName={styles.PopupAnimated}
        root={{ onOpenChangeComplete: (open) => setPhase(open ? 'open' : 'closed') }}
      />
      <output className={styles.Output}>animation settled: {phase}</output>
    </div>
  );
}

/** Animate with CSS transitions on `[data-starting-style]`/`[data-ending-style]` and `transform-origin: var(--transform-origin)`; the popup stays mounted mid-transition and `onOpenChangeComplete` fires once it settles (pair with `actionsRef.unmount()` for JS animation libraries). */
export const AnimatedPopup: Story = {
  render: () => <AnimatedExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(comboboxInput(canvas));
    await expect(await canvas.findByText('animation settled: open')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('animation settled: closed')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* TypeScript                                                          */
/* ------------------------------------------------------------------ */

/**
 * Typed wrapper from the docs TypeScript guidance: generics flow through
 * `Combobox.Root.Props<Value, Multiple>`, so `defaultValue` must be an array
 * exactly when `multiple` is set. Generics cannot cross React context in
 * compound components, so a wrapper is the supported reuse path (#3951).
 */
function MyCombobox<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple> & {
    label: string;
    placeholder?: string;
    itemToLabel: (item: Value) => string;
  },
): React.JSX.Element {
  const { label, placeholder, itemToLabel, ...rootProps } = props;
  const id = React.useId();
  return (
    <Combobox.Root {...rootProps}>
      <div className={styles.Label}>
        <label htmlFor={id}>{label}</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder={placeholder} id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.List className={styles.List}>
              {(item: Value) => (
                <Combobox.Item key={itemToLabel(item)} value={item} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{itemToLabel(item)}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** A `MyCombobox<Value, Multiple>` typed wrapper — the story compiling is the test: single mode takes a scalar `defaultValue`, multiple mode requires an array. */
export const TypedWrapperComponent: Story = {
  render: () => (
    <div className={styles.Row}>
      <MyCombobox
        label="Fruit"
        placeholder="One fruit"
        items={fruits}
        itemToLabel={(fruit) => fruit.label}
        defaultValue={fruits[2]}
      />
      <MyCombobox
        label="Fruits"
        placeholder="Many fruits"
        items={fruits}
        itemToLabel={(fruit) => fruit.label}
        multiple
        defaultValue={[fruits[0], fruits[1]]}
      />
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/combobox)       */
/* ------------------------------------------------------------------ */

interface SyncTarget {
  value: string;
  label: string;
}

interface SyncTargetGroup {
  value: string;
  items: SyncTarget[];
}

const syncTargetGroups: SyncTargetGroup[] = [
  {
    value: 'Databases',
    items: [
      { value: 'postgres', label: 'PostgreSQL' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'sqlite', label: 'SQLite' },
    ],
  },
  {
    value: 'Warehouses',
    items: [
      { value: 'snowflake', label: 'Snowflake' },
      { value: 'bigquery', label: 'BigQuery' },
    ],
  },
];

function GroupedSyncTargetPicker() {
  const id = React.useId();
  return (
    <Combobox.Root items={syncTargetGroups}>
      <div className={styles.Label}>
        <label htmlFor={id}>Sync target</label>
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input placeholder="e.g. Snowflake" id={id} className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <CaretDownIcon />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No sync targets found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(group: SyncTargetGroup) => {
                const isLast =
                  syncTargetGroups.findIndex((candidate) => candidate.value === group.value) ===
                  syncTargetGroups.length - 1;
                return (
                  <React.Fragment key={group.value}>
                    <Combobox.Group items={group.items} className={styles.Group}>
                      <Combobox.GroupLabel className={styles.GroupLabel}>
                        {group.value}
                      </Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(item: SyncTarget) => (
                          <Combobox.Item key={item.value} value={item} className={styles.Item}>
                            <Combobox.ItemIndicator className={styles.ItemIndicator}>
                              <CheckIcon />
                            </Combobox.ItemIndicator>
                            <span className={styles.ItemText}>{item.label}</span>
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                    {!isLast ? <Combobox.Separator className={styles.Separator} /> : null}
                  </React.Fragment>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/**
 * Recreation of the grouped, separated-list pattern from electric-sql/electric
 * `Combobox.tsx` (Apache-2.0, code-ok, research/d-real-world-usage/combobox/ranked.json #4)
 * — a CSS-Modules-styled Combobox with `Separator` marking the boundary between groups,
 * recomposed here as a sync-target picker for a local-first-sync-style admin console.
 */
export const RealWorldGroupedSyncTargetPicker: Story = {
  tags: ['recreation'],
  render: () => <GroupedSyncTargetPicker />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = comboboxInput(canvas);

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox');
    await waitFor(() => expect(listbox).toBeVisible());
    await waitFor(() => expect(body.getByText('Databases')).toBeVisible());
    await waitFor(() => expect(body.getByText('Warehouses')).toBeVisible());

    // Arrow across the group boundary: last item of the first group, then the first
    // item of the next group, past the Separator.
    const sqlite = await body.findByRole('option', { name: 'SQLite' });
    await waitFor(() => expect(sqlite).toBeVisible());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', sqlite.id));

    await userEvent.keyboard('{ArrowDown}');
    const snowflake = await body.findByRole('option', { name: 'Snowflake' });
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', snowflake.id));

    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(input).toHaveValue('Snowflake'));
  },
};

interface LlmModel {
  value: string;
  label: string;
}

interface LlmModelGroup {
  value: string;
  items: LlmModel[];
}

const llmModelGroups: LlmModelGroup[] = [
  {
    value: 'OpenAI',
    items: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { value: 'o1', label: 'o1' },
    ],
  },
  {
    value: 'Anthropic',
    items: [
      { value: 'claude-opus', label: 'Claude Opus' },
      { value: 'claude-sonnet', label: 'Claude Sonnet' },
      { value: 'claude-haiku', label: 'Claude Haiku' },
    ],
  },
  {
    value: 'Google',
    items: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-flash', label: 'Gemini Flash' },
    ],
  },
];

const allLlmModels = llmModelGroups.flatMap((group) => group.items);

function ModelPickerWithGroups({ root }: { root?: Partial<Combobox.Root.Props<LlmModel, true>> }) {
  const id = React.useId();
  return (
    <Combobox.Root items={llmModelGroups} multiple {...root}>
      <div className={styles.Label}>
        <label htmlFor={id}>Models</label>
        <Combobox.InputGroup className={styles.ChipsInputGroup}>
          <Combobox.Chips className={styles.Chips}>
            <Combobox.Value>
              {(value: LlmModel[]) => (
                <React.Fragment>
                  {value.map((model) => (
                    <Combobox.Chip
                      key={model.value}
                      className={styles.Chip}
                      aria-label={model.label}
                    >
                      {model.label}
                      <Combobox.ChipRemove
                        className={styles.ChipRemove}
                        aria-label={`Remove ${model.label}`}
                      >
                        <XIcon />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'e.g. Claude Sonnet'}
                    className={styles.ChipsInput}
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty>
              <div className={styles.Empty}>No models found.</div>
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(group: LlmModelGroup) => {
                const isLast =
                  llmModelGroups.findIndex((candidate) => candidate.value === group.value) ===
                  llmModelGroups.length - 1;
                return (
                  <React.Fragment key={group.value}>
                    <Combobox.Group items={group.items} className={styles.Group}>
                      <Combobox.GroupLabel className={styles.GroupLabel}>
                        {group.value}
                      </Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(item: LlmModel) => (
                          <Combobox.Item key={item.value} value={item} className={styles.Item}>
                            <Combobox.ItemIndicator className={styles.ItemIndicator}>
                              <CheckIcon />
                            </Combobox.ItemIndicator>
                            <span className={styles.ItemText}>{item.label}</span>
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                    {!isLast ? <Combobox.Separator className={styles.Separator} /> : null}
                  </React.Fragment>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/**
 * Recreation of the near-full-anatomy multi-select chips pattern from
 * latitude-dev/latitude-llm `combobox/combobox.tsx` (MIT, code-ok,
 * research/d-real-world-usage/combobox/ranked.json #7) — the same chip/grouping
 * composition also converged on independently by langgenius/dify and cosscom/coss
 * (both link-only, not reused here), recomposed with grouped items: models selected
 * across providers render as removable chips that wrap across lines.
 */
export const RealWorldMultiSelectModelPickerWithGroups: Story = {
  tags: ['recreation'],
  render: () => (
    <ModelPickerWithGroups
      root={{
        defaultValue: [allLlmModels[0], allLlmModels[3], allLlmModels[6]],
      }}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Selections span three different provider groups.
    await expect(canvas.getByLabelText('GPT-4o')).toBeVisible();
    await expect(canvas.getByLabelText('Claude Opus')).toBeVisible();
    await expect(canvas.getByLabelText('Gemini Pro')).toBeVisible();

    await userEvent.click(canvas.getByLabelText('Remove Claude Opus'));
    await waitFor(() => expect(canvas.queryByLabelText('Claude Opus')).not.toBeInTheDocument());

    const [input] = canvas.getAllByRole('combobox');
    await userEvent.click(input);
    await userEvent.click(await body.findByRole('option', { name: 'Claude Haiku' }));
    await waitFor(() => expect(canvas.getByLabelText('Claude Haiku')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
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
      <path d="m4.5 4.5 7 7m-7 0 7-7" />
    </svg>
  );
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}
