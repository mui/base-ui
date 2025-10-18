import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronDown, ChevronsUpDown, Check, Plus, Minus } from 'lucide-react';
import {
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompletePortal,
  AutocompletePositioner,
  AutocompleteRoot,
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxRoot,
  ComboboxTrigger,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldsetRoot,
  FieldsetLegend,
  Form,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
  RadioGroup,
  Radio,
  RadioIndicator,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectTrigger,
  SelectValue,
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SliderValue,
  SwitchRoot,
  SwitchThumb,
  Toast,
  ToastProvider,
} from './components';

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
  const toastManager = Toast.useToastManager();

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
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldLabel>Server name</FieldLabel>
            <FieldControl
              ref={ref}
              value={value}
              onBlur={onBlur}
              onValueChange={onChange}
              placeholder="e.g. api-server-01"
            />
            <FieldError match={!!error}>{error?.message}</FieldError>
          </FieldRoot>
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
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <ComboboxRoot items={REGIONS} value={value} onValueChange={onChange}>
              <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
                <FieldLabel>Region</FieldLabel>
                <ComboboxInput placeholder="e.g. eu-central-1" ref={ref} onBlur={onBlur} />
                <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
                  <ComboboxClear />
                  <ComboboxTrigger>
                    <ChevronDown className="size-4" />
                  </ComboboxTrigger>
                </div>
              </div>
              <ComboboxPortal>
                <ComboboxPositioner>
                  <ComboboxPopup>
                    <ComboboxEmpty>No matches</ComboboxEmpty>
                    <ComboboxList>
                      {(region: string) => {
                        return (
                          <ComboboxItem key={region} value={region}>
                            <ComboboxItemIndicator>
                              <Check className="size-3" />
                            </ComboboxItemIndicator>
                            <div className="col-start-2">{region}</div>
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxList>
                  </ComboboxPopup>
                </ComboboxPositioner>
              </ComboboxPortal>
            </ComboboxRoot>
            <FieldError match={!!error}>{error?.message}</FieldError>
          </FieldRoot>
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
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <AutocompleteRoot
              items={IMAGES}
              mode="both"
              itemToStringValue={(itemValue: Image) => itemValue.url}
              value={value}
              onValueChange={onChange}
            >
              <FieldLabel>Container image</FieldLabel>
              <FieldDescription>Provide a registry URL including tags</FieldDescription>
              <AutocompleteInput
                placeholder="e.g. docker.io/library/node:latest"
                ref={ref}
                onBlur={onBlur}
              />

              <AutocompletePortal>
                <AutocompletePositioner>
                  <AutocompletePopup>
                    <AutocompleteList>
                      {(image: Image) => {
                        return (
                          <AutocompleteItem key={image.url} value={image}>
                            <span className="text-base leading-6">{image.name}</span>
                            <span className="font-mono whitespace-nowrap text-xs leading-4 opacity-80">
                              {image.url}
                            </span>
                          </AutocompleteItem>
                        );
                      }}
                    </AutocompleteList>
                  </AutocompletePopup>
                </AutocompletePositioner>
              </AutocompletePortal>
            </AutocompleteRoot>
            <FieldError match={!!error}>{error?.message}</FieldError>
          </FieldRoot>
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
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldLabel>Server type</FieldLabel>
            <SelectRoot items={SERVER_TYPES} value={value} onValueChange={onChange} inputRef={ref}>
              <SelectTrigger className="w-48" onBlur={onBlur}>
                <SelectValue />
                <SelectIcon>
                  <ChevronsUpDown className="size-4" />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectPositioner>
                  <SelectPopup>
                    <SelectScrollUpArrow />
                    <SelectList>
                      {SERVER_TYPES.map(({ label, value: serverType }) => {
                        return (
                          <SelectItem key={serverType} value={serverType}>
                            <SelectItemIndicator>
                              <Check className="size-3" />
                            </SelectItemIndicator>
                            <SelectItemText>{label}</SelectItemText>
                          </SelectItem>
                        );
                      })}
                    </SelectList>
                    <SelectScrollDownArrow />
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </SelectRoot>
            <FieldError match={!!error}>{error?.message}</FieldError>
          </FieldRoot>
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
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <NumberFieldRoot value={value} min={1} max={64} onValueChange={onChange}>
              <FieldLabel>Number of instances</FieldLabel>
              <NumberFieldGroup>
                <NumberFieldDecrement>
                  <Minus className="size-4" />
                </NumberFieldDecrement>
                <NumberFieldInput className="!w-16" ref={ref} onBlur={onBlur} />
                <NumberFieldIncrement>
                  <Plus className="size-4" />
                </NumberFieldIncrement>
              </NumberFieldGroup>
            </NumberFieldRoot>
            <FieldError match={!!error}>{error?.message}</FieldError>
          </FieldRoot>
        )}
      />
      <Controller
        name="scalingThreshold"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldsetRoot
              render={
                <SliderRoot
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
              <FieldsetLegend>Scaling threshold</FieldsetLegend>
              <SliderValue className="col-start-2 text-end" />
              <SliderControl>
                <SliderTrack>
                  <SliderIndicator />
                  <SliderThumb index={0} onBlur={onBlur} inputRef={ref} />
                  <SliderThumb index={1} onBlur={onBlur} />
                </SliderTrack>
              </SliderControl>
            </FieldsetRoot>
          </FieldRoot>
        )}
      />
      <Controller
        name="storageType"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldsetRoot
              render={
                <RadioGroup
                  className="gap-4"
                  value={value}
                  onValueChange={onChange}
                  inputRef={ref}
                />
              }
            >
              <FieldsetLegend className="-mt-px">Storage type</FieldsetLegend>
              <FieldLabel>
                <Radio value="ssd" onBlur={onBlur}>
                  <RadioIndicator />
                </Radio>
                SSD
              </FieldLabel>
              <FieldLabel>
                <Radio value="hdd" onBlur={onBlur}>
                  <RadioIndicator />
                </Radio>
                HDD
              </FieldLabel>
            </FieldsetRoot>
          </FieldRoot>
        )}
      />
      <Controller
        name="restartOnFailure"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldLabel className="flex flex-row gap-4">
              Restart on failure
              <SwitchRoot checked={value} inputRef={ref} onCheckedChange={onChange} onBlur={onBlur}>
                <SwitchThumb />
              </SwitchRoot>
            </FieldLabel>
          </FieldRoot>
        )}
      />
      <Controller
        name="backupSchedule"
        control={control}
        render={({
          field: { ref, name, value, onBlur, onChange },
          fieldState: { invalid, isTouched, isDirty },
        }) => (
          <FieldRoot name={name} invalid={invalid} touched={isTouched} dirty={isDirty}>
            <FieldsetRoot render={<CheckboxGroup value={value} onValueChange={onChange} />}>
              <FieldsetLegend className="mb-2">Backup schedule</FieldsetLegend>
              <div className="flex gap-4">
                {['daily', 'weekly', 'monthly'].map((val) => {
                  return (
                    <FieldLabel key={val} className="capitalize">
                      <Checkbox
                        value={val}
                        inputRef={val === 'daily' ? ref : undefined}
                        onBlur={onBlur}
                      >
                        <CheckboxIndicator>
                          <Check className="size-3" />
                        </CheckboxIndicator>
                      </Checkbox>
                      {val}
                    </FieldLabel>
                  );
                })}
              </div>
            </FieldsetRoot>
          </FieldRoot>
        )}
      />
      <Button type="submit" className="mt-4">
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
