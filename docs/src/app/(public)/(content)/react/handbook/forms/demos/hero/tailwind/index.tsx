import * as React from 'react';
import { ChevronDown, ChevronsUpDown, Check, Plus, Minus } from 'lucide-react';
import * as Autocomplete from './autocomplete';
import { Button } from './button';
import * as Checkbox from './checkbox';
import { CheckboxGroup } from './checkbox-group';
import * as Combobox from './combobox';
import * as Field from './field';
import * as Fieldset from './fieldset';
import { Form } from './form';
import * as NumberField from './number-field';
import { RadioGroup } from './radio-group';
import * as Radio from './radio';
import * as Select from './select';
import * as Slider from './slider';
import * as Switch from './switch';
import { ToastProvider, useToastManager } from './toast';

function ExampleForm() {
  const toastManager = useToastManager();
  return (
    <Form
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const entries = Object.fromEntries(formData as any);
        entries.backupSchedule = formData.getAll('backupSchedule');
        entries.scalingThreshold = formData.getAll('scalingThreshold');
        toastManager.add({
          title: 'Form submitted',
          description: 'The form contains these values:',
          data: entries,
        });
      }}
    >
      <Field.Root name="serverName">
        <Field.Label>Server name</Field.Label>
        <Field.Control
          defaultValue=""
          placeholder="e.g. api-server-01"
          required
          pattern=".*[A-Za-z].*"
        />
        <Field.Error />
      </Field.Root>
      <Field.Root name="region">
        <Combobox.Root items={REGIONS} required>
          <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
            <Field.Label>Region</Field.Label>
            <Combobox.Input placeholder="e.g. eu-central-1" />
            <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
              <Combobox.Clear />
              <Combobox.Trigger>
                <ChevronDown className="size-4" />
              </Combobox.Trigger>
            </div>
          </div>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Empty>No matches</Combobox.Empty>
                <Combobox.List>
                  {(region: string) => {
                    return (
                      <Combobox.Item key={region} value={region}>
                        <Combobox.ItemIndicator>
                          <Check className="size-3" />
                        </Combobox.ItemIndicator>
                        <div className="col-start-2">{region}</div>
                      </Combobox.Item>
                    );
                  }}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Field.Error />
      </Field.Root>
      <Field.Root name="containerImage">
        <Autocomplete.Root
          items={IMAGES}
          mode="both"
          itemToStringValue={(itemValue: Image) => itemValue.url}
          required
        >
          <Field.Label>Container image</Field.Label>
          <Field.Description>Provide a registry URL including tags</Field.Description>
          <Autocomplete.Input placeholder="e.g. docker.io/library/node:latest" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(image: Image) => {
                    return (
                      <Autocomplete.Item key={image.url} value={image}>
                        <span className="text-base leading-6">{image.name}</span>
                        <span className="font-mono whitespace-nowrap text-xs leading-4 opacity-80">
                          {image.url}
                        </span>
                      </Autocomplete.Item>
                    );
                  }}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
        <Field.Error />
      </Field.Root>
      <Field.Root name="serverType">
        <Field.Label>Server type</Field.Label>
        <Select.Root items={SERVER_TYPES} required>
          <Select.Trigger className="w-48">
            <Select.Value />
            <Select.Icon>
              <ChevronsUpDown className="size-4" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.ScrollUpArrow />
                <Select.List>
                  {SERVER_TYPES.map(({ label, value }) => {
                    return (
                      <Select.Item key={value} value={value}>
                        <Select.ItemIndicator>
                          <Check className="size-3" />
                        </Select.ItemIndicator>
                        <Select.ItemText>{label}</Select.ItemText>
                      </Select.Item>
                    );
                  })}
                </Select.List>
                <Select.ScrollDownArrow />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Error />
      </Field.Root>
      <Field.Root name="numOfInstances">
        <NumberField.Root defaultValue={undefined} min={1} max={64} required>
          <Field.Label>Number of instances</Field.Label>
          <NumberField.Group>
            <NumberField.Decrement>
              <Minus className="size-4" />
            </NumberField.Decrement>
            <NumberField.Input className="!w-16" />
            <NumberField.Increment>
              <Plus className="size-4" />
            </NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
        <Field.Error />
      </Field.Root>
      <Field.Root name="scalingThreshold">
        <Fieldset.Root
          render={
            <Slider.Root
              defaultValue={[0.2, 0.8]}
              thumbAlignment="edge"
              min={0}
              max={1}
              step={0.01}
              format={{
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }}
              className="w-98/100 gap-y-2"
            />
          }
        >
          <Fieldset.Legend>Scaling threshold</Fieldset.Legend>
          <Slider.Value className="col-start-2 text-end" />
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider.Control>
        </Fieldset.Root>
      </Field.Root>
      <Field.Root name="storageType" className="mt-3">
        <Fieldset.Root render={<RadioGroup className="gap-4" defaultValue="ssd" />}>
          <Fieldset.Legend className="-mt-px">Storage type</Fieldset.Legend>
          <Field.Label>
            <Radio.Root value="ssd">
              <Radio.Indicator />
            </Radio.Root>
            SSD
          </Field.Label>
          <Field.Label>
            <Radio.Root value="hdd">
              <Radio.Indicator />
            </Radio.Root>
            HDD
          </Field.Label>
        </Fieldset.Root>
      </Field.Root>
      <Field.Root name="restartOnFailure">
        <Field.Label className="flex flex-row gap-4">
          Restart on failure
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
        </Field.Label>
      </Field.Root>
      <Field.Root name="backupSchedule">
        <Fieldset.Root render={<CheckboxGroup />}>
          <Fieldset.Legend className="mb-2">Backup schedule</Fieldset.Legend>
          <div className="flex gap-4">
            {['daily', 'weekly', 'monthly'].map((val) => {
              return (
                <Field.Label key={val} className="capitalize">
                  <Checkbox.Root value={val}>
                    <Checkbox.Indicator>
                      <Check className="size-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  {val}
                </Field.Label>
              );
            })}
          </div>
        </Fieldset.Root>
      </Field.Root>
      <Button type="submit" className="mt-4">
        Launch server
      </Button>
    </Form>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ExampleForm />
    </ToastProvider>
  );
}

function cartesian<T extends string[][]>(...arrays: T): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]],
  );
}

const REGIONS = cartesian(['us', 'eu', 'ap'], ['central', 'east', 'west'], ['1', '2', '3']).map(
  (v) => v.join('-'),
);

interface Image {
  url: string;
  name: string;
}

const IMAGES: Image[] = [
  { url: 'docker.io/library/nginx:1.29-alpine', name: 'nginx:1.29-alpine' },
  { url: 'docker.io/library/node:22-slim', name: 'node:22-slim' },
  { url: 'docker.io/library/postgres:18', name: 'postgres:18' },
  { url: 'docker.io/library/redis:8.2.2-alpine', name: 'redis:8.2.2-alpine' },
];

const SERVER_TYPES = [
  { label: 'Select server type', value: null },
  ...cartesian(['t', 'm'], ['1', '2'], ['small', 'medium', 'large']).map((v) => {
    const value = v.join('.').replace('.', '');
    return {
      label: value,
      value,
    };
  }),
];
