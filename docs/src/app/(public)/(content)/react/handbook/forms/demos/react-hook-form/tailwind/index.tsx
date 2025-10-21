import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronDown, ChevronsUpDown, Check, Plus, Minus } from 'lucide-react';
import { Button } from '../../hero/tailwind/button';
import { CheckboxGroup } from '../../hero/tailwind/checkbox-group';
import { Form } from '../../hero/tailwind/form';
import { RadioGroup } from '../../hero/tailwind/radio-group';
import { ToastProvider, useToastManager } from '../../hero/tailwind/toast';
import * as Autocomplete from '../../hero/tailwind/autocomplete';
import * as Checkbox from '../../hero/tailwind/checkbox';
import * as Combobox from '../../hero/tailwind/combobox';
import * as Field from '../../hero/tailwind/field';
import * as Fieldset from '../../hero/tailwind/fieldset';
import * as NumberField from '../../hero/tailwind/number-field';
import * as Radio from '../../hero/tailwind/radio';
import * as Select from '../../hero/tailwind/select';
import * as Slider from '../../hero/tailwind/slider';
import * as Switch from '../../hero/tailwind/switch';

interface FormValues {
  serverName: string;
  region: string | null;
  containerImage: string;
  serverType: string | null;
  numOfInstances: number | null;
  scalingThreshold: number[];
  storageType: 'ssd' | 'hdd';
  restartOnFailure: boolean;
  backupSchedule: string[];
}

function ReactHookForm() {
  const toastManager = useToastManager();

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      serverName: '',
      region: null,
      containerImage: '',
      serverType: null,
      numOfInstances: null,
      scalingThreshold: [0.2, 0.8],
      storageType: 'ssd',
      restartOnFailure: true,
      backupSchedule: [],
    },
  });

  async function submitForm(data: FormValues) {
    toastManager.add({
      title: 'Form submitted',
      description: 'The form contains these values:',
      data,
    });
  }

  return (
    <Form onSubmit={handleSubmit(submitForm)}>
      <Controller
        name="serverName"
        control={control}
        rules={{
          required: 'This field is required',
          minLength: { value: 2, message: 'Too short' },
        }}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty, error },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Field.Label>Server name</Field.Label>
            <Field.Control
              ref={ref}
              value={value}
              onBlur={onBlur}
              onValueChange={onChange}
              placeholder="e.g. api-server-01"
            />
            <Field.Error match={!!error}>{error?.message}</Field.Error>
          </Field.Root>
        )}
      />
      <Controller
        name="region"
        control={control}
        rules={{
          required: 'This field is required',
        }}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty, error },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Combobox.Root items={REGIONS} value={value} onValueChange={onChange}>
              <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
                <Field.Label>Region</Field.Label>
                <Combobox.Input placeholder="e.g. eu-central-1" ref={ref} onBlur={onBlur} />
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
            <Field.Error match={!!error}>{error?.message}</Field.Error>
          </Field.Root>
        )}
      />
      <Controller
        name="containerImage"
        control={control}
        rules={{
          required: 'This field is required',
        }}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty, error },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Autocomplete.Root
              items={IMAGES}
              mode="both"
              itemToStringValue={(itemValue: Image) => itemValue.url}
              value={value}
              onValueChange={onChange}
            >
              <Field.Label>Container image</Field.Label>
              <Field.Description>Provide a registry URL including tags</Field.Description>
              <Autocomplete.Input
                placeholder="e.g. docker.io/library/node:latest"
                ref={ref}
                onBlur={onBlur}
              />

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
            <Field.Error match={!!error}>{error?.message}</Field.Error>
          </Field.Root>
        )}
      />
      <Controller
        name="serverType"
        control={control}
        rules={{
          required: 'This field is required',
        }}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty, error },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Field.Label>Server type</Field.Label>
            <Select.Root items={SERVER_TYPES} value={value} onValueChange={onChange} inputRef={ref}>
              <Select.Trigger className="w-48" onBlur={onBlur}>
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
                      {SERVER_TYPES.map(({ label, value: serverType }) => {
                        return (
                          <Select.Item key={serverType} value={serverType}>
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
            <Field.Error match={!!error}>{error?.message}</Field.Error>
          </Field.Root>
        )}
      />
      <Controller
        name="numOfInstances"
        control={control}
        rules={{
          required: 'This field is required',
        }}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty, error },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <NumberField.Root value={value} min={1} max={64} onValueChange={onChange}>
              <Field.Label>Number of instances</Field.Label>
              <NumberField.Group>
                <NumberField.Decrement>
                  <Minus className="size-4" />
                </NumberField.Decrement>
                <NumberField.Input className="!w-16" ref={ref} onBlur={onBlur} />
                <NumberField.Increment>
                  <Plus className="size-4" />
                </NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
            <Field.Error match={!!error}>{error?.message}</Field.Error>
          </Field.Root>
        )}
      />
      <Controller
        name="scalingThreshold"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Fieldset.Root
              render={
                <Slider.Root
                  value={value}
                  onValueChange={onChange}
                  onValueCommitted={onChange}
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
                  <Slider.Thumb index={0} onBlur={onBlur} inputRef={ref} />
                  <Slider.Thumb index={1} onBlur={onBlur} />
                </Slider.Track>
              </Slider.Control>
            </Fieldset.Root>
          </Field.Root>
        )}
      />
      <Controller
        name="storageType"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Fieldset.Root
              render={
                <RadioGroup
                  className="gap-4"
                  value={value}
                  onValueChange={onChange}
                  inputRef={ref}
                />
              }
            >
              <Fieldset.Legend className="-mt-px">Storage type</Fieldset.Legend>
              <Field.Label>
                <Radio.Root value="ssd" onBlur={onBlur}>
                  <Radio.Indicator />
                </Radio.Root>
                SSD
              </Field.Label>
              <Field.Label>
                <Radio.Root value="hdd" onBlur={onBlur}>
                  <Radio.Indicator />
                </Radio.Root>
                HDD
              </Field.Label>
            </Fieldset.Root>
          </Field.Root>
        )}
      />
      <Controller
        name="restartOnFailure"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Field.Label className="gap-4">
              Restart on failure
              <Switch.Root
                checked={value}
                inputRef={ref}
                onCheckedChange={onChange}
                onBlur={onBlur}
              >
                <Switch.Thumb />
              </Switch.Root>
            </Field.Label>
          </Field.Root>
        )}
      />
      <Controller
        name="backupSchedule"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <Field.Root name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <Fieldset.Root render={<CheckboxGroup value={value} onValueChange={onChange} />}>
              <Fieldset.Legend className="mb-2">Backup schedule</Fieldset.Legend>
              <div className="flex gap-4">
                {['daily', 'weekly', 'monthly'].map((val) => {
                  return (
                    <Field.Label key={val} className="capitalize">
                      <Checkbox.Root
                        value={val}
                        inputRef={val === 'daily' ? ref : undefined}
                        onBlur={onBlur}
                      >
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
        )}
      />
      <Button type="submit" className="mt-3">
        Launch server
      </Button>
    </Form>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ReactHookForm />
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
  { label: 'Select server type', value: null },
  ...cartesian(['t', 'm'], ['1', '2'], ['small', 'medium', 'large']).map((part) => {
    const value = part.join('.').replace('.', '');
    return { label: value, value };
  }),
];
