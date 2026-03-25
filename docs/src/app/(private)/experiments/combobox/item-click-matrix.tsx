'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './item-click-matrix.module.css';

const selectionModes = ['single', 'multiple'] as const;
const inputLocations = ['outside-popup', 'inside-popup'] as const;
const items = [
  'apple',
  'apricot',
  'banana',
  'blackberry',
  'blueberry',
  'cherry',
  'coconut',
  'dragonfruit',
  'fig',
  'grape',
  'grapefruit',
  'guava',
  'kiwi',
  'mango',
  'papaya',
  'peach',
  'pear',
  'pineapple',
  'plum',
  'pomegranate',
  'raspberry',
  'strawberry',
];

type SelectionMode = (typeof selectionModes)[number];
type InputLocation = (typeof inputLocations)[number];

interface Scenario {
  selectionMode: SelectionMode;
  inputLocation: InputLocation;
  keepFilterText: boolean;
}

function createInitialEventLog() {
  return ['ready: empty input'];
}

export default function ComboboxItemClickMatrix() {
  const [selectionMode, setSelectionMode] = React.useState<SelectionMode>('multiple');
  const [inputLocation, setInputLocation] = React.useState<InputLocation>('outside-popup');
  const [keepFilterText, setKeepFilterText] = React.useState(true);

  const currentScenario: Scenario = {
    selectionMode,
    inputLocation,
    keepFilterText,
  };

  return (
    <div className={styles.Page}>
      <section className={styles.Hero}>
        <h1 className={styles.Title}>Combobox item-click behavior</h1>
        <p className={styles.Description}>
          Use the knobs to explore when <code>keepFilterText</code> is helpful in repeated selection
          workflows. Typing <code>ap</code> gives you several matching items to pick from in a row.
        </p>
      </section>

      <section className={styles.Layout}>
        <div className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2 className={styles.PanelTitle}>Controls</h2>
            <p className={styles.PanelText}>
              Type a short query like <code>ap</code> in the preview to test filtering.
            </p>
          </div>

          <div className={styles.ControlGrid}>
            <label className={styles.Field}>
              <span className={styles.FieldLabel}>Selection mode</span>
              <select
                className={styles.Select}
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
              >
                {selectionModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.Field}>
              <span className={styles.FieldLabel}>Input location</span>
              <select
                className={styles.Select}
                value={inputLocation}
                onChange={(event) => setInputLocation(event.target.value as InputLocation)}
              >
                {inputLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.Field}>
              <span className={styles.FieldLabel}>keepFilterText</span>
              <select
                className={styles.Select}
                value={keepFilterText ? 'true' : 'false'}
                onChange={(event) => setKeepFilterText(event.target.value === 'true')}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </label>
          </div>
        </div>

        <div className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2 className={styles.PanelTitle}>Live preview</h2>
            <p className={styles.PanelText}>
              Open the popup, type <code>ap</code>, then select a few matching items.
            </p>
          </div>

          <ScenarioPreview key={JSON.stringify(currentScenario)} scenario={currentScenario} />
        </div>
      </section>
    </div>
  );
}

function ScenarioPreview({ scenario }: { scenario: Scenario }) {
  if (scenario.selectionMode === 'multiple') {
    return <MultipleScenarioPreview scenario={scenario} />;
  }

  return <SingleScenarioPreview scenario={scenario} />;
}

function SingleScenarioPreview({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [eventLog, setEventLog] = React.useState<string[]>(createInitialEventLog);

  function appendEvent(message: string) {
    setEventLog((prev) => [message, ...prev].slice(0, 6));
  }

  function resetPreview() {
    setOpen(false);
    setValue(null);
    setInputValue('');
    setEventLog(createInitialEventLog());
  }

  return (
    <div className={styles.PreviewStack}>
      <PreviewToolbar selectedLabel={`Selected value: ${value ?? 'none'}`} onReset={resetPreview} />

      <div className={styles.PreviewSurface}>
        <Combobox.Root
          items={items}
          open={open}
          value={value}
          inputValue={inputValue}
          keepFilterText={scenario.keepFilterText}
          onOpenChange={(nextOpen, details) => {
            setOpen(nextOpen);
            appendEvent(`open -> ${nextOpen ? 'true' : 'false'} (${details.reason})`);
          }}
          onValueChange={(nextValue, details) => {
            setValue(nextValue);
            appendEvent(`value -> ${nextValue ?? 'null'} (${details.reason})`);
          }}
          onInputValueChange={(nextValue, details) => {
            setInputValue(nextValue);
            appendEvent(
              `input -> ${nextValue === '' ? 'empty string' : `"${nextValue}"`} (${details.reason})`,
            );
          }}
        >
          <PreviewComboboxContent inputLocation={scenario.inputLocation} triggerLabel={value} />
        </Combobox.Root>
      </div>

      <PreviewStatus open={open} inputValue={inputValue} eventLog={eventLog} />
    </div>
  );
}

function MultipleScenarioPreview({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [eventLog, setEventLog] = React.useState<string[]>(createInitialEventLog);

  function appendEvent(message: string) {
    setEventLog((prev) => [message, ...prev].slice(0, 6));
  }

  function resetPreview() {
    setOpen(false);
    setValue([]);
    setInputValue('');
    setEventLog(createInitialEventLog());
  }

  return (
    <div className={styles.PreviewStack}>
      <PreviewToolbar
        selectedLabel={`Selected values: ${value.length === 0 ? 'none' : value.join(', ')}`}
        onReset={resetPreview}
      />

      <div className={styles.PreviewSurface}>
        <Combobox.Root
          items={items}
          multiple
          open={open}
          value={value}
          inputValue={inputValue}
          keepFilterText={scenario.keepFilterText}
          onOpenChange={(nextOpen, details) => {
            setOpen(nextOpen);
            appendEvent(`open -> ${nextOpen ? 'true' : 'false'} (${details.reason})`);
          }}
          onValueChange={(nextValue, details) => {
            setValue(nextValue);
            appendEvent(
              `value -> ${nextValue.length === 0 ? '[]' : nextValue.join(', ')} (${details.reason})`,
            );
          }}
          onInputValueChange={(nextValue, details) => {
            setInputValue(nextValue);
            appendEvent(
              `input -> ${nextValue === '' ? 'empty string' : `"${nextValue}"`} (${details.reason})`,
            );
          }}
        >
          <PreviewComboboxContent
            inputLocation={scenario.inputLocation}
            triggerLabel={value.length === 0 ? 'Open popup' : `${value.length} selected`}
          />
        </Combobox.Root>
      </div>

      <PreviewStatus open={open} inputValue={inputValue} eventLog={eventLog} />
    </div>
  );
}

function PreviewToolbar({
  selectedLabel,
  onReset,
}: {
  selectedLabel: string;
  onReset: () => void;
}) {
  return (
    <div className={styles.Toolbar}>
      <button type="button" className={styles.ResetButton} onClick={onReset}>
        Reset preview
      </button>
      <span className={styles.ToolbarHint}>{selectedLabel}</span>
    </div>
  );
}

function PreviewComboboxContent({
  inputLocation,
  triggerLabel = 'Open popup',
}: {
  inputLocation: InputLocation;
  triggerLabel?: string | null;
}) {
  const popupClassName =
    inputLocation === 'inside-popup' ? `${styles.Popup} ${styles.PopupWithInput}` : styles.Popup;

  return (
    <React.Fragment>
      {inputLocation === 'outside-popup' ? (
        <Combobox.InputGroup className={styles.InputGroup}>
          <Combobox.Input className={styles.Input} placeholder="Type to search" />
          <div className={styles.ActionButtons}>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <ChevronDownIcon className={styles.TriggerIcon} />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      ) : (
        <Combobox.Trigger className={styles.PopupTrigger}>
          <span>{triggerLabel ?? 'Open popup'}</span>
          <ChevronDownIcon className={styles.TriggerIcon} />
        </Combobox.Trigger>
      )}

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} align="start" sideOffset={4}>
          <Combobox.Popup className={popupClassName} aria-label="Item click matrix">
            {inputLocation === 'inside-popup' && (
              <div className={styles.InputContainer}>
                <Combobox.Input className={styles.PopupInput} placeholder="Type to search" />
              </div>
            )}

            <Combobox.List className={styles.List}>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <span className={styles.ItemText}>{item}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </React.Fragment>
  );
}

function PreviewStatus({
  open,
  inputValue,
  eventLog,
}: {
  open: boolean;
  inputValue: string;
  eventLog: string[];
}) {
  return (
    <div className={styles.StatusStack}>
      <div className={styles.StatusGrid}>
        <ExpectationCard label="Actual popup" value={open ? 'open' : 'closed'} />
        <ExpectationCard label="Actual input value" value={formatInputValue(inputValue)} />
      </div>

      <div className={styles.LogCard}>
        <div className={styles.LogHeader}>Event log</div>
        <ul className={styles.LogList}>
          {eventLog.map((event, index) => (
            <li key={`${event}-${index}`}>{event}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ExpectationCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.ExpectationCard}>
      <div className={styles.ExpectationLabel}>{label}</div>
      <div className={styles.ExpectationValue}>{value}</div>
    </div>
  );
}

function formatInputValue(value: string) {
  return value === '' ? 'empty string' : `"${value}"`;
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
