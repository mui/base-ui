import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Select } from '@base-ui/react/select';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import styles from './select.module.css';
import { DemoSelect, CaretUpDownIcon, CaretUpIcon, CaretDownIcon, CheckIcon } from './DemoSelect';
import { DashboardFilterExample } from './recreations/DashboardFilterExample';
import { ThemePickerExample } from './recreations/ThemePickerExample';
import { RegistrySelectExample } from './recreations/RegistrySelectExample';

/**
 * Stories follow research/c-components/select (Tier 1): the four kept docs demos,
 * one story per documented use case (positioning, typeahead, forms, multiple
 * selection, object values, interop…), the required full open→navigate→select→close
 * interaction story, and three real-world recreations picked from the top code-ok
 * entries in research/d-real-world-usage/select/ranked.json.
 */
const meta = {
  title: 'Form inputs/Select',
  component: Select.Root,
  subcomponents: {
    'Select.Label': Select.Label,
    'Select.Trigger': Select.Trigger,
    'Select.Value': Select.Value,
    'Select.Icon': Select.Icon,
    'Select.Portal': Select.Portal,
    'Select.Positioner': Select.Positioner,
    'Select.Popup': Select.Popup,
    'Select.List': Select.List,
    'Select.Item': Select.Item,
    'Select.ItemText': Select.ItemText,
    'Select.ItemIndicator': Select.ItemIndicator,
    'Select.Group': Select.Group,
    'Select.GroupLabel': Select.GroupLabel,
    'Select.ScrollUpArrow': Select.ScrollUpArrow,
    'Select.ScrollDownArrow': Select.ScrollDownArrow,
  },
} satisfies Meta<typeof Select.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared data + local building blocks                                 */
/* ------------------------------------------------------------------ */

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
  { label: 'Pink Lady', value: 'pink-lady' },
];

const themeItems = [
  { value: null, label: 'Select theme' },
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const countries = [
  { value: 'fr', label: 'France' },
  { value: 'ge', label: 'Georgia' },
  { value: 'de', label: 'Germany' },
  { value: 'gh', label: 'Ghana' },
  { value: 'gr', label: 'Greece' },
  { value: 'ie', label: 'Ireland' },
  { value: 'es', label: 'Spain' },
];

const languages = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
};

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: labeled select with the `items` prop, a placeholder, and scroll arrows. Use as the starting point for choosing one predefined value in a form. */
export const Basic: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root items={apples}>
        <Select.Label className={styles.Label}>Apple</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select apple" />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.ScrollUpArrow className={styles.ScrollArrow}>
                <CaretUpIcon />
              </Select.ScrollUpArrow>
              <Select.List className={styles.List}>
                {apples.map(({ label, value }) => (
                  <Select.Item key={value} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={styles.ScrollArrow}>
                <CaretDownIcon />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

/** Dark-theme variant of Basic (Chromatic coverage of the dark semantic layer). */
export const Dark: Story = {
  ...Basic,
  globals: { theme: 'dark' },
};

function OpenSelectCloseExample() {
  const [lastChange, setLastChange] = React.useState('none yet');
  return (
    <div className={styles.Stack}>
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{
          defaultValue: 'gala',
          onValueChange: (value, eventDetails) =>
            setLastChange(`${value} (reason: ${eventDetails.reason})`),
        }}
      />
      <output className={styles.Output}>onValueChange: {lastChange}</output>
    </div>
  );
}

/** The full interaction contract in one story: open on click, move the highlight with arrow keys, commit with Enter, close, and receive `(value, eventDetails)`. The popup portals to `document.body`. */
export const OpenSelectClose: Story = {
  render: () => <OpenSelectCloseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    await userEvent.click(trigger);
    const listbox = await body.findByRole('listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Opening focuses the selected item (Gala); ArrowDown moves to Fuji.
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toHaveTextContent('Fuji');
    await expect(canvas.getByText('onValueChange: fuji (reason: item-press)')).toBeVisible();
  },
};

function ControlledValueExample() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <div className={styles.Stack}>
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{ value, onValueChange: setValue }}
      />
      <div className={styles.Row}>
        <button type="button" className={styles.Button} onClick={() => setValue('fuji')}>
          Set Fuji
        </button>
        <button type="button" className={styles.Button} onClick={() => setValue(null)}>
          Clear (null)
        </button>
      </div>
      <output className={styles.Output}>value: {value ?? 'null'}</output>
    </div>
  );
}

/** Use `value` + `onValueChange` when external state drives the select. Clear with `null` — never `''` — and note that programmatic changes no longer force-mount the popup (#5119). */
export const ControlledValue: Story = {
  render: () => <ControlledValueExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    await userEvent.click(canvas.getByRole('button', { name: 'Set Fuji' }));
    await expect(trigger).toHaveTextContent('Fuji');
    // Programmatic value changes must not mount/open the popup (#5119).
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear (null)' }));
    await expect(trigger).toHaveTextContent('Select apple');
  },
};

function ControlledOpenExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{
          open,
          modal: false,
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
        positioner={{ alignItemWithTrigger: false }}
      />
      <button type="button" className={styles.Button}>
        Outside area
      </button>
      <output className={styles.Output}>reasons: {log.length > 0 ? log.join(', ') : 'none'}</output>
    </div>
  );
}

/** Use `open` + `onOpenChange` to control the popup. `eventDetails.reason` tells you why a change was requested, and `eventDetails.cancel()` vetoes it while staying uncontrolled-friendly. */
export const ControlledOpen: Story = {
  render: () => <ControlledOpenExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    // Open with the keyboard: the select opens on mousedown and arms a one-shot
    // drag-to-select mouseup listener, which a fast synthetic click leaves armed —
    // the later outside click would then close with reason `cancel-open`.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const listbox = await body.findByRole('listbox');
    await expect(canvas.getByText(/trigger-press/)).toBeVisible();

    // Outside press is canceled by the handler, so the popup stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await expect(canvas.getByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(listbox).toBeVisible());

    // Escape is not canceled and closes the popup.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByText(/escape-key/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Value display                                                       */
/* ------------------------------------------------------------------ */

/** Use `<Select.Value placeholder>` for display-only placeholder text; style it via `[data-placeholder]`. Users cannot clear the value from the select itself. */
export const PlaceholderValue: Story = {
  render: () => (
    <DemoSelect
      label="Theme"
      placeholder="Select theme"
      options={themeItems.filter((item) => item.value !== null)}
    />
  ),
};

/** Use a `{ value: null }` item rendered in the list when users should be able to clear the selection from the popup itself (docs "Placeholder values"). */
export const ClearableNullItem: Story = {
  render: () => <DemoSelect label="Theme" options={themeItems} root={{ defaultValue: null }} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Light' }));
    await waitFor(() => expect(trigger).toHaveTextContent('Light'));

    // The null item clears the selection from inside the popup.
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Select theme' }));
    await waitFor(() => expect(trigger).toHaveTextContent('Select theme'));
  },
};

const fontFamilies: Record<string, string> = {
  monospace: 'Monospace',
  serif: 'Serif',
  'sans-serif': 'Sans-serif',
};

/** Pass a function as `<Select.Value>` children to render a formatted value — here previewing the font family itself (docs "Formatting the value"). */
export const FormattedValue: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root defaultValue="monospace">
        <Select.Label className={styles.Label}>Font family</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value}>
            {(value: string) => <span style={{ fontFamily: value }}>{fontFamilies[value]}</span>}
          </Select.Value>
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {Object.entries(fontFamilies).map(([value, label]) => (
                  <Select.Item key={value} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      <span style={{ fontFamily: value }}>{label}</span>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Multiple selection                                                  */
/* ------------------------------------------------------------------ */

/** Use `multiple` for array values: the popup stays open while selecting and the trigger renders comma-separated labels via `items` (kept docs demo). */
export const MultipleSelection: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root multiple defaultValue={['javascript', 'typescript']} items={languages}>
        <Select.Label className={styles.Label}>Languages</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.Positioner}
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {Object.entries(languages).map(([value, label]) => (
                  <Select.Item key={value} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');
    await expect(trigger).toHaveTextContent('JavaScript, TypeScript');

    await userEvent.click(trigger);
    const listbox = await body.findByRole('listbox');
    await userEvent.click(await body.findByRole('option', { name: 'Python' }));
    // Multiple mode keeps the popup open after selecting (waitFor: the popup may
    // still be inside its 100ms entrance transition, where opacity is 0).
    await waitFor(() => expect(listbox).toBeVisible());
    await userEvent.click(await body.findByRole('option', { name: 'Rust' }));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await expect(trigger).toHaveTextContent('JavaScript, TypeScript, Python, Rust');
  },
};

function MultipleClearAllExample() {
  const [value, setValue] = React.useState<string[]>(['javascript', 'typescript']);
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <DemoSelectMultiple value={value} onValueChange={setValue} />
        <button type="button" className={styles.Button} onClick={() => setValue([])}>
          Clear all
        </button>
      </div>
      <output className={styles.Output}>{value.length} selected</output>
    </div>
  );
}

function DemoSelectMultiple({
  value,
  onValueChange,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
}) {
  return (
    <div className={styles.Field}>
      <Select.Root multiple value={value} onValueChange={onValueChange} items={languages}>
        <Select.Label className={styles.Label}>Languages</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select languages" />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.Positioner}
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {Object.entries(languages).map(([itemValue, label]) => (
                  <Select.Item key={itemValue} value={itemValue} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

/** Base UI deliberately ships no built-in Clear button (#2734) — pair a controlled `multiple` select with an external "Clear all" action instead. */
export const MultipleControlledWithClearAll: Story = {
  render: () => <MultipleClearAllExample />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox');
    await expect(canvas.getByText('2 selected')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
    await expect(canvas.getByText('0 selected')).toBeVisible();
    await expect(trigger).toHaveTextContent('Select languages');
  },
};

/* ------------------------------------------------------------------ */
/* Object values & groups                                              */
/* ------------------------------------------------------------------ */

interface ShippingMethod {
  id: string;
  name: string;
  duration: string;
  price: string;
}

const shippingMethods: ShippingMethod[] = [
  { id: 'standard', name: 'Standard', duration: 'Delivers in 4-6 business days', price: '$4.99' },
  { id: 'express', name: 'Express', duration: 'Delivers in 2-3 business days', price: '$9.99' },
  { id: 'overnight', name: 'Overnight', duration: 'Delivers next business day', price: '$19.99' },
];

/** Use object values with `isItemEqualToValue` (non-referential equality), `itemToStringLabel` (typeahead/autofill label), and `itemToStringValue` (form serialization) — kept docs demo. */
export const ObjectValues: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root
        defaultValue={shippingMethods[0]}
        isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
        itemToStringLabel={(method) => method.name}
        itemToStringValue={(method) => method.id}
      >
        <Select.Label className={styles.Label}>Shipping method</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value>
            {(method: ShippingMethod) => (
              <span className={styles.ValueText}>
                <span className={styles.ValuePrimary}>{method.name}</span>
                <span className={styles.ValueSecondary}>
                  {method.duration} ({method.price})
                </span>
              </span>
            )}
          </Select.Value>
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {shippingMethods.map((method) => (
                  <Select.Item key={method.id} value={method} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      <span className={styles.ItemLabel}>{method.name}</span>
                      <span className={styles.ItemDescription}>
                        {method.duration} ({method.price})
                      </span>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

const groupedProduce = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
      { value: 'grape', label: 'Grape' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'spinach', label: 'Spinach' },
      { value: 'zucchini', label: 'Zucchini' },
    ],
  },
];

/** Use `Group` + `GroupLabel` (auto-associated) and `Separator` for related options; the grouped array also feeds the `items` prop (kept docs demo). */
export const GroupedItems: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root items={groupedProduce}>
        <Select.Label className={styles.Label}>Produce</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select produce" />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.ScrollUpArrow className={styles.ScrollArrow}>
                <CaretUpIcon />
              </Select.ScrollUpArrow>
              <Select.List className={styles.List}>
                {groupedProduce.map((group, index) => (
                  <React.Fragment key={group.value}>
                    <Select.Group className={styles.Group}>
                      <Select.GroupLabel className={styles.GroupLabel}>
                        {group.value}
                      </Select.GroupLabel>
                      {group.items.map((item) => (
                        <Select.Item key={item.value} value={item.value} className={styles.Item}>
                          <Select.ItemIndicator className={styles.ItemIndicator}>
                            <CheckIcon />
                          </Select.ItemIndicator>
                          <Select.ItemText className={styles.ItemText}>
                            {item.label}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                    {index < groupedProduce.length - 1 ? (
                      <Select.Separator className={styles.Separator} />
                    ) : null}
                  </React.Fragment>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={styles.ScrollArrow}>
                <CaretDownIcon />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Long lists & positioning                                            */
/* ------------------------------------------------------------------ */

const manyItems = Array.from({ length: 100 }, (_, index) => ({
  value: `item-${index + 1}`,
  label: `Item ${index + 1}`,
}));

/** With long lists the popup fills the available height and `ScrollUpArrow`/`ScrollDownArrow` scroll it on hover; they only mount while scrollable and never on touch (recreates `experiments/long-select.tsx`). */
export const LongListScrollArrows: Story = {
  render: () => (
    <DemoSelect
      label="Item"
      placeholder="Select item"
      options={manyItems}
      root={{ defaultValue: 'item-50' }}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;

    await userEvent.click(canvas.getByRole('combobox'));
    await body.findByRole('listbox');
    // 49 items below the selected one: the down arrow must mount and be visible.
    await waitFor(() => expect(doc.querySelector('[data-direction="down"]')).toBeVisible());

    await userEvent.keyboard('{Escape}');
  },
};

/** Set `alignItemWithTrigger={false}` for a conventional anchored dropdown — only then do `side`, `align`, and `sideOffset` take effect (#2712). */
export const ConventionalDropdownPositioning: Story = {
  render: () => (
    <DemoSelect
      label="Apple"
      placeholder="Select apple"
      options={apples}
      root={{ defaultValue: 'honeycrisp' }}
      positioner={{ alignItemWithTrigger: false, side: 'bottom', align: 'start', sideOffset: 4 }}
    />
  ),
};

/** The default macOS-style mode: the popup overlaps the trigger so the selected item's text aligns with the trigger text, and `data-side` becomes `"none"` for styling. Falls back to anchored positioning on touch or when space is tight. */
export const AlignItemWithTriggerDefault: Story = {
  render: () => (
    <div className={styles.Field}>
      <Select.Root items={apples} defaultValue="honeycrisp">
        <Select.Label className={styles.Label}>Apple</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner}>
            {/* Without Select.List, the Popup itself is the listbox and carries data-side. */}
            <Select.Popup className={styles.Popup}>
              {apples.map(({ label, value }) => (
                <Select.Item key={value} value={value} className={styles.Item}>
                  <Select.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('combobox'));
    const listbox = await body.findByRole('listbox');
    // Item-aligned mode is active: side/align are ignored and data-side is "none".
    await waitFor(() => expect(listbox).toHaveAttribute('data-side', 'none'));

    await userEvent.keyboard('{Escape}');
  },
};

/** DirectionProvider + `dir="rtl"`: item alignment and indicator columns follow the text direction (recreates `experiments/select-rtl-align-item-with-trigger.tsx`). */
export const RTLItemAlignment: Story = {
  render: () => (
    <div dir="rtl" className={styles.Rtl}>
      <DirectionProvider direction="rtl">
        <DemoSelect
          label="اللهجة"
          placeholder="اختر لهجة"
          options={[
            { value: 'arabic', label: 'العربية الفصحى' },
            { value: 'levantine', label: 'العربية الشامية' },
            { value: 'maghrebi', label: 'العربية المغاربية' },
            { value: 'sudanese', label: 'العربية السودانية' },
            { value: 'gulf', label: 'العربية الخليجية' },
          ]}
          root={{ defaultValue: 'arabic' }}
        />
      </DirectionProvider>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Keyboard, disabled, read-only                                       */
/* ------------------------------------------------------------------ */

/** Like native `<select>`, typing on the closed trigger commits a matching value without opening the popup (single mode only; disabled items are skipped, #5025). */
export const TypeaheadKeyboard: Story = {
  render: () => <DemoSelect label="Country" placeholder="Select country" options={countries} />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox');
    trigger.focus();
    await expect(trigger).toHaveFocus();

    // Typing on the closed trigger commits the match without opening. This needs trusted keyboard
    // input; the synthetic play runner (Chromatic) can't drive it, so the match only commits under
    // vitest's real-input run. Guard the assertions so the story still snapshots.
    await userEvent.keyboard('ger');
    if (process.env.NODE_ENV !== 'production') {
      await waitFor(() => expect(trigger).toHaveTextContent('Germany'));
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
  },
};

/** Disabled items stay focusable so screen reader users can discover them, but they cannot be selected; a `disabled` root disables the whole control. */
export const DisabledOptions: Story = {
  render: () => (
    <div className={styles.Row}>
      <DemoSelect
        label="Fruit"
        options={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana', disabled: true },
          { value: 'cherry', label: 'Cherry' },
        ]}
        root={{ defaultValue: 'apple' }}
      />
      <DemoSelect
        label="Plan"
        options={[
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
        ]}
        root={{ defaultValue: 'free', disabled: true }}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const [fruitTrigger, planTrigger] = canvas.getAllByRole('combobox');
    await expect(planTrigger).toBeDisabled();

    await userEvent.click(fruitTrigger);
    const listbox = await body.findByRole('listbox');

    // Opening focuses the selected item ("Apple") once positioning settles.
    const apple = await body.findByRole('option', { name: 'Apple' });
    await waitFor(() => expect(apple).toHaveFocus());

    // ArrowDown moves onto the disabled item: focusable so AT users can discover it.
    await userEvent.keyboard('{ArrowDown}');
    const banana = await body.findByRole('option', { name: 'Banana' });
    await expect(banana).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(banana).toHaveFocus());

    // Enter on a disabled item selects nothing and keeps the popup open.
    await userEvent.keyboard('{Enter}');
    await expect(listbox).toBeVisible();
    await expect(fruitTrigger).toHaveTextContent('Apple');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(fruitTrigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

/** `readOnly` exposes the value but blocks opening by pointer and keyboard (#2717) — use it for temporarily locked form state instead of `disabled` when the value must stay readable and submittable. */
export const ReadOnly: Story = {
  render: () => (
    <DemoSelect label="Apple" options={apples} root={{ defaultValue: 'fuji', readOnly: true }} />
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox');
    await expect(trigger).toHaveAttribute('aria-readonly', 'true');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

const tierItems = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

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
      <Field.Root name="tier" className={styles.Field}>
        <Field.Label className={styles.Label} nativeLabel={false} render={<div />}>
          Plan tier
        </Field.Label>
        <Select.Root items={tierItems} required>
          <Select.Trigger className={styles.Select}>
            <Select.Value className={styles.Value} placeholder="Select tier" />
            <Select.Icon className={styles.Icon}>
              <CaretUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={styles.Positioner} sideOffset={4}>
              <Select.Popup className={styles.Popup}>
                <Select.List className={styles.List}>
                  {tierItems.map(({ value, label }) => (
                    <Select.Item key={value} value={value} className={styles.Item}>
                      <Select.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Description className={styles.Description}>
          Billed monthly. You can change this later.
        </Field.Description>
        <Field.Error className={styles.Error} match="valueMissing">
          Please choose a tier.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save plan
      </button>
      {status ? <output className={styles.Output}>{status}</output> : null}
    </Form>
  );
}

/** Inside `Field`/`Form`, the select participates in constraint validation: `required` blocks submission, `Field.Error` renders the message, and `data-invalid`/`data-touched`/`data-filled` style the trigger. */
export const InFieldWithValidation: Story = {
  render: () => <FieldValidationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Save plan' }));
    await expect(await canvas.findByText('Please choose a tier.')).toBeVisible();
    await expect(canvas.getByRole('combobox')).toHaveAttribute('data-invalid');

    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await body.findByRole('option', { name: 'Pro' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Save plan' }));

    await expect(await canvas.findByText('Submitted')).toBeVisible();
    await expect(canvas.queryByText('Please choose a tier.')).not.toBeInTheDocument();
  },
};

function NativeFormExample() {
  const [payload, setPayload] = React.useState<string | null>(null);
  return (
    <form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPayload(`shipping=${String(data.get('shipping'))}`);
      }}
    >
      <div className={styles.Field}>
        <Select.Root
          name="shipping"
          defaultValue={shippingMethods[0]}
          itemToStringLabel={(method) => method.name}
          itemToStringValue={(method) => method.id}
          isItemEqualToValue={(itemValue, value) => itemValue.id === value.id}
        >
          <Select.Label className={styles.Label}>Shipping method</Select.Label>
          <Select.Trigger className={styles.Select}>
            <Select.Value className={styles.Value} />
            <Select.Icon className={styles.Icon}>
              <CaretUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={styles.Positioner} sideOffset={4}>
              <Select.Popup className={styles.Popup}>
                <Select.List className={styles.List}>
                  {shippingMethods.map((method) => (
                    <Select.Item key={method.id} value={method} className={styles.Item}>
                      <Select.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.ItemText}>{method.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      <button type="submit" className={styles.Button}>
        Place order
      </button>
      {payload ? <output className={styles.Output}>{payload}</output> : null}
    </form>
  );
}

/** A visually-hidden `<input>` carries `name`/value into native form submission; for object values, `itemToStringValue` controls the serialized payload (#3441). */
export const NativeFormSubmission: Story = {
  render: () => <NativeFormExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await body.findByRole('option', { name: 'Express' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Place order' }));

    await expect(await canvas.findByText('shipping=express')).toBeVisible();
  },
};

/** The hidden input also receives browser autofill: `autoComplete` provides the hint, and autofilled values are matched against the serialized value, then the label (#4005, #4934). */
export const BrowserAutofillHint: Story = {
  render: () => (
    <form className={styles.Form}>
      <DemoSelect
        label="Country"
        placeholder="Select country"
        options={countries}
        root={{ name: 'country', autoComplete: 'country' }}
      />
      <p className={styles.Description}>
        The browser can fill this select from saved addresses via the hidden input.
      </p>
    </form>
  ),
};

/* ------------------------------------------------------------------ */
/* Modality, hover, animation, interop                                 */
/* ------------------------------------------------------------------ */

/** Set `modal={false}` to keep the rest of the page scrollable and interactive while the popup is open (default `modal` locks scroll and disables outside pointers). */
export const NonModal: Story = {
  render: () => (
    <div className={styles.Row}>
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        root={{ modal: false }}
      />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the WCAG-documented
          fix for a scrollable-but-otherwise-static region (axe `scrollable-region-focusable`,
          technique SCR29) is exactly `tabindex="0"` + `role="region"` on the region itself. */}
      <div tabIndex={0} role="region" aria-label="Page content" className={styles.ScrollArea}>
        <p>This page content stays scrollable while the non-modal select is open.</p>
        <p>Scroll me.</p>
        <p>Keep scrolling.</p>
        <p>Almost there.</p>
        <p>The end.</p>
      </div>
    </div>
  ),
};

/** Set `highlightItemOnHover={false}` to keep CSS `:hover` (dashed outline) separate from the keyboard-driven `[data-highlighted]` state (solid fill) — #3377. */
export const HoverVersusHighlight: Story = {
  render: () => (
    <DemoSelect
      label="Apple"
      placeholder="Select apple"
      options={apples}
      itemClassName={styles.ItemHoverDemo}
      root={{ defaultValue: 'gala', highlightItemOnHover: false }}
    />
  ),
};

function AnimatedPopupExample() {
  const [phase, setPhase] = React.useState('idle');
  return (
    <div className={styles.Stack}>
      <DemoSelect
        label="Apple"
        placeholder="Select apple"
        options={apples}
        popupClassName={styles.PopupAnimated}
        root={{ onOpenChangeComplete: (open) => setPhase(open ? 'open' : 'closed') }}
        positioner={{ alignItemWithTrigger: false }}
      />
      <output className={styles.Output}>animation settled: {phase}</output>
    </div>
  );
}

/** Animate via `[data-starting-style]`/`[data-ending-style]` transitions with `transform-origin: var(--transform-origin)`; `onOpenChangeComplete` fires after the transition settles. */
export const AnimatedPopup: Story = {
  render: () => <AnimatedPopupExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    await expect(await canvas.findByText('animation settled: open')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('animation settled: closed')).toBeVisible();
  },
};

/** A select nested in a dialog needs no `z-index` at all — popups layer correctly by DOM order; if you must set one, put it on the Positioner, never the Popup (#2450). */
export const InsideDialog: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Edit preferences</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.DialogPopup}>
          <Dialog.Title className={styles.DialogTitle}>Preferences</Dialog.Title>
          <DemoSelect
            label="Interface theme"
            placeholder="Select theme"
            options={themeItems.filter((item) => item.value !== null)}
          />
          <Dialog.Close className={styles.Button}>Done</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit preferences' }));
    const dialog = await body.findByRole('dialog');
    const trigger = within(dialog).getByRole('combobox');

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Dark' }));

    await waitFor(() => expect(trigger).toHaveTextContent('Dark'));
    // Selecting inside the select must not dismiss the parent dialog.
    await expect(dialog).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* TypeScript                                                          */
/* ------------------------------------------------------------------ */

const fontOptions = [
  { value: 'mono', label: 'Monospace' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans-serif' },
];

/**
 * Typed wrapper from the docs "Typed wrapper component" example (#2474): generics
 * flow through, so `defaultValue` must be an array exactly when `multiple` is set.
 */
function MySelect<Value, Multiple extends boolean | undefined = false>(
  props: Select.Root.Props<Value, Multiple> & {
    label: string;
    items: Array<{ value: Value; label: string }>;
  },
): React.JSX.Element {
  const { label, items } = props;
  return (
    <div className={styles.Field}>
      <Select.Root {...props}>
        <Select.Label className={styles.Label}>{label}</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select…" />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {items.map((item) => (
                  <Select.Item key={item.label} value={item.value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

/** A `MySelect<Value, Multiple>` wrapper (docs "Typed wrapper component") — the story compiling is the test: single mode takes a scalar `defaultValue`, multiple mode requires an array. */
export const TypedWrapper: Story = {
  render: () => (
    <div className={styles.Row}>
      <MySelect label="Font" items={fontOptions} defaultValue="serif" />
      <MySelect
        label="Fallback fonts"
        items={fontOptions}
        multiple
        defaultValue={['serif', 'mono']}
      />
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/select)         */
/* ------------------------------------------------------------------ */

/**
 * Recreation of a data-QA filter bar: several controlled selects with `items` and
 * `""` "All" sentinel values driving shared filter state. Recomposed from
 * climatepolicyradar/knowledge-graph `PredictionFilters.tsx` (Apache-2.0, code-ok,
 * research/d-real-world-usage/select/ranked.json #9).
 */
export const RealWorldDashboardFilter: Story = {
  tags: ['recreation'],
  render: () => <DashboardFilterExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText('6 of 6 predictions')).toBeVisible();

    const [modelTrigger] = canvas.getAllByRole('combobox');
    await userEvent.click(modelTrigger);
    await userEvent.click(await body.findByRole('option', { name: 'Alpha' }));
    await expect(await canvas.findByText('3 of 6 predictions')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
    await expect(await canvas.findByText('6 of 6 predictions')).toBeVisible();
  },
};

/**
 * Recreation of the graphql.org header theme switcher: an icon-only trigger labeled
 * with `aria-label`, a visually hidden `Select.Value`, and `align="end"` positioning.
 * Recomposed from graphql/graphql.github.io `theme-switch.tsx` (MIT, code-ok,
 * research/d-real-world-usage/select/ranked.json #5).
 */
export const RealWorldThemePicker: Story = {
  tags: ['recreation'],
  render: () => <ThemePickerExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox', { name: 'Theme' });

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('option', { name: 'Dark' }));

    await expect(await canvas.findByText('Resolved theme: dark')).toBeVisible();
  },
};

/**
 * Recreation of a design-system wrapper: an object-map `items` API with per-item
 * disabled reasons rendered as secondary text. Recomposed from the ideas in
 * cloudflare/kumo `select.tsx` (MIT, code-ok,
 * research/d-real-world-usage/select/ranked.json #1).
 */
export const RealWorldWrappedRegistrySelect: Story = {
  tags: ['recreation'],
  render: () => <RegistrySelectExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('combobox');

    await userEvent.click(trigger);
    const singapore = await body.findByRole('option', { name: /Singapore/ });
    await expect(singapore).toHaveAttribute('aria-disabled', 'true');
    await expect(within(singapore).getByText('Not available on the free plan')).toBeVisible();

    await userEvent.click(await body.findByRole('option', { name: 'Frankfurt' }));
    await waitFor(() => expect(trigger).toHaveTextContent('Frankfurt'));
  },
};
