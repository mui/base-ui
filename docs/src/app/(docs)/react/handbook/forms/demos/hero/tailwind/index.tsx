'use client';
import * as React from 'react';
import { ChevronDown, ChevronsUpDown, Check, Plus, Minus } from 'lucide-react';
import { Button } from '../../components/button';
import { CheckboxGroup } from '../../components/checkbox-group';
import { Form } from '../../components/form';
import { RadioGroup } from '../../components/radio-group';
import { ToastProvider, useToastManager } from '../../components/toast';
import * as Autocomplete from '../../components/autocomplete';
import * as Checkbox from '../../components/checkbox';
import * as Combobox from '../../components/combobox';
import * as Field from '../../components/field';
import * as Fieldset from '../../components/fieldset';
import * as NumberField from '../../components/number-field';
import * as Radio from '../../components/radio';
import * as Select from '../../components/select';
import * as Slider from '../../components/slider';
import * as Switch from '../../components/switch';

function ExampleForm() {
  const toastManager = useToastManager();
  return (
    <Form
      aria-label="Launch new cloud server"
      onFormSubmit={(formValues) => {
        toastManager.add({
          title: 'Form submitted',
          description: 'The form contains these values:',
          data: formValues,
        });
      }}
    >
      <Field.Root name="serverName">
        <div className="flex gap-1">
          <Field.Label>Server name</Field.Label>
          <span className="text-sm text-red-800">*</span>
        </div>
        <Field.Description>Must be 3 or more characters long</Field.Description>
        <Field.Control
          defaultValue=""
          placeholder="api-server-01"
          required
          minLength={3}
          pattern=".*[A-Za-z].*"
        />
        <Field.Error match="valueMissing">This field is required</Field.Error>
        <Field.Error match="tooShort">This field must be at least 3 characters long</Field.Error>
        <Field.Error match="patternMismatch">
          This field must contain at least one letter
        </Field.Error>
      </Field.Root>

      <Field.Root name="region">
        <Combobox.Root items={REGIONS} required>
          <div className="flex gap-1">
            <Field.Label>Region</Field.Label>
            <span className="text-sm text-red-800">*</span>
          </div>
          <div className="relative w-full text-gray-900">
            <Combobox.Input placeholder="eu-central-1" />
            <div className="absolute right-3 top-0 bottom-0 flex gap-1 items-center justify-center">
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
                          <Check className="size-4" />
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
        <Field.Error match="valueMissing">This field is required</Field.Error>
      </Field.Root>

      <Field.Root name="containerImage">
        <Autocomplete.Root
          items={IMAGES}
          mode="both"
          itemToStringValue={(itemValue: Image) => itemValue.url}
          required
        >
          <div className="flex gap-1">
            <Field.Label>Container image</Field.Label>
            <span className="text-sm text-red-800">*</span>
          </div>
          <Field.Description>Enter a registry URL with optional tags</Field.Description>
          <Autocomplete.Input placeholder="docker.io/library/node:latest" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(image: Image) => {
                    return (
                      <Autocomplete.Item key={image.url} value={image}>
                        <span className="text-sm leading-6">{image.name}</span>
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
        <Field.Error match="valueMissing">This field is required</Field.Error>
      </Field.Root>

      <Field.Root name="serverType">
        <div className="flex gap-1">
          <Field.Label className="cursor-default" nativeLabel={false} render={<div />}>
            Server type
          </Field.Label>
          <span className="text-sm text-red-800">*</span>
        </div>
        <Select.Root items={SERVER_TYPES} defaultValue={SERVER_TYPES[0].value} required>
          <Select.Trigger>
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
                          <Check className="size-4" />
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
        <Field.Error match="valueMissing">This field is required</Field.Error>
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
              className="w-full"
            />
          }
        >
          <div className="flex justify-between">
            <Fieldset.Legend>Scaling threshold</Fieldset.Legend>
            <Slider.Value />
          </div>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider.Control>
        </Fieldset.Root>
      </Field.Root>

      <Field.Root name="numOfInstances">
        <NumberField.Root defaultValue={1} min={1} max={64} required>
          <div className="flex gap-1">
            <Field.Label>Number of instances</Field.Label>
            <span className="text-sm text-red-800">*</span>
          </div>
          <Field.Description>Must be between 1 and 64</Field.Description>
          <NumberField.Group>
            <NumberField.Input />
            <div className="absolute right-0 top-0 bottom-0 border-l border-gray-300 flex flex-col items-center justify-center">
              <NumberField.Increment>
                <Plus className="size-3" />
              </NumberField.Increment>
              <div className="w-full h-px bg-gray-300" />
              <NumberField.Decrement>
                <Minus className="size-3" />
              </NumberField.Decrement>
            </div>
          </NumberField.Group>
        </NumberField.Root>
        <Field.Error match="valueMissing">This field is required</Field.Error>
        <Field.Error match="rangeOverflow">This field must be less than 64</Field.Error>
        <Field.Error match="rangeUnderflow">This field must be greater than 1</Field.Error>
      </Field.Root>

      <Field.Root name="storageType">
        <Fieldset.Root render={<RadioGroup className="flex flex-col gap-2" defaultValue="ssd" />}>
          <Fieldset.Legend>Storage type</Fieldset.Legend>
          <div className="flex flex-col gap-1">
            <Field.Item>
              <Field.Label>
                <Radio.Root value="ssd">
                  <Radio.Indicator />
                </Radio.Root>
                SSD
              </Field.Label>
            </Field.Item>
            <Field.Item>
              <Field.Label>
                <Radio.Root value="hdd">
                  <Radio.Indicator />
                </Radio.Root>
                HDD
              </Field.Label>
            </Field.Item>
          </div>
        </Fieldset.Root>
      </Field.Root>

      <Field.Root name="allowedNetworkProtocols">
        <Fieldset.Root
          render={<CheckboxGroup defaultValue={['https']} className="flex flex-col gap-2" />}
        >
          <Fieldset.Legend>Allowed network protocols</Fieldset.Legend>
          <div className="flex flex-col gap-1">
            {['https', 'http', 'ssh'].map((val) => {
              return (
                <Field.Item key={val}>
                  <Field.Label className="uppercase font-normal">
                    <Checkbox.Root value={val}>
                      <Checkbox.Indicator>
                        <Check className="size-3.5" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    {val}
                  </Field.Label>
                </Field.Item>
              );
            })}
          </div>
        </Fieldset.Root>
      </Field.Root>

      <Field.Root name="restartOnFailure">
        <Field.Label className="gap-2">
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          Restart on failure
        </Field.Label>
      </Field.Root>

      <Button type="submit" className="mt-3">
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
  (part) => part.join('-'),
);

interface Image {
  url: string;
  name: string;
}
/* prettier-ignore */
const IMAGES: Image[] = ['nginx:1.29-alpine', 'node:22-slim', 'postgres:18', 'redis:8.2.2-alpine'].map((name) => ({
  url: `docker.io/library/${name}`,
  name,
}));

const SERVER_TYPES = [
  ...cartesian(['t', 'm'], ['1', '2'], ['small', 'medium', 'large']).map((part) => {
    const value = part.join('.').replace('.', '');
    return { label: value, value };
  }),
];
