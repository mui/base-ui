/* eslint-disable react/no-children-prop */
'use client';
import * as React from 'react';
import { useForm } from '@tanstack/react-form';

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
} from './_components';

export default function App() {
  const { Field: FormField, handleSubmit } = useForm({
    defaultValues: {
      // null defaultValue doesn't work, TSF throws a type error
      serverName: '',
      staticIpAddress: '',
      region: '',
      image: '',
      instanceType: '',
      cpuCores: 1,
      cpuUtilization: [0.3, 0.8],
      // with casting `number | null` the bound field.handleChange throws
      // a type error because it doesn't know that the numberfield is clearable
      numOfInstances: 1 as number | null,
      storageType: '',
      backupSchedule: [] as string[],
    },
    onSubmit: async ({ value }) => {
      console.log('submit', value);
    },
    validators: {
      onSubmit: ({ value: formValues }) => {
        console.log('validate on submit', formValues);
        const fields: Record<string, string | undefined> = {};

        if (!formValues.serverName) {
          fields.serverName = 'Required';
        }

        if (!formValues.staticIpAddress) {
          fields.staticIpAddress = 'Required';
        } else if (!IPV4_PATTERN.test(formValues.staticIpAddress)) {
          fields.staticIpAddress = 'Invalid ipv4 address';
        }

        if (!formValues.region) {
          fields.region = 'Required';
        }

        if (!formValues.image) {
          fields.image = 'Required';
        } else if (!CONTAINER_URL_PATTERN.test(formValues.image)) {
          fields.image = 'Invalid ipv4 address';
        }

        if (!formValues.instanceType) {
          fields.instanceType = 'Required';
        }

        if (formValues.numOfInstances == null) {
          fields.numOfInstances = 'Required';
        }

        if (!formValues.storageType) {
          fields.storageType = 'Required';
        }

        if (formValues.backupSchedule.length === 0) {
          fields.backupSchedule = 'Required';
        }

        return { fields };
      },
    },
  });
  return (
    <div className="font-sans w-80">
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <h2 className="border-b border-gray-200 pb-3 text-lg font-medium text-gray-900">
          Configure VPS
        </h2>
        <FormField
          name="serverName"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (!fieldApi.state.meta.isDirty) {
                return undefined;
              }
              if (!value) {
                return 'Required';
              }
              return value.length < 4 ? 'At least 4 characters' : undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <FieldLabel>Server name</FieldLabel>
                <FieldControl
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="e.g. api-server-01"
                />

                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />
        <FormField
          name="staticIpAddress"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (!fieldApi.state.meta.isDirty) {
                return undefined;
              }
              if (!value) {
                return 'Required';
              }
              return IPV4_PATTERN.test(value) ? undefined : 'Invalid ipv4 address';
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <FieldLabel>Static IP</FieldLabel>
                <FieldDescription>Only IPv4 addresses are supported</FieldDescription>
                <FieldControl
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="e.g. 10.2.3.45"
                  className="!w-40"
                />

                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />
        <FormField
          name="region"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (!fieldApi.state.meta.isDirty) {
                return undefined;
              }
              if (!value) {
                return 'Required';
              }
              return value.includes('east') ? `${value} is unavailable` : undefined;
            },
            onChange: ({ value, fieldApi }) => {
              // revalidate on change
              if (fieldApi.state.meta.isDirty && fieldApi.state.meta.isBlurred && value) {
                const message = value.includes('east') ? `${value} is unavailable` : undefined;
                fieldApi.setErrorMap({ onBlur: message });
              }
              return undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <ComboboxRoot
                  items={REGIONS}
                  // useForm doesn't work well with `defaultValue: null`, but an
                  // empty string is considered filled by Combobox and show the Clear button
                  value={field.state.value || null}
                  onValueChange={field.handleChange}
                >
                  <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
                    <FieldLabel>Choose a region</FieldLabel>
                    <ComboboxInput placeholder="e.g. eu-central-1" onBlur={field.handleBlur} />
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

                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="image"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (!fieldApi.state.meta.isDirty) {
                return undefined;
              }
              if (!value) {
                return 'Required';
              }
              return CONTAINER_URL_PATTERN.test(value)
                ? undefined
                : 'Please enter a valid container URL';
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <AutocompleteRoot
                  items={IMAGES}
                  mode="both"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  itemToStringValue={(itemValue: Image) => itemValue.url}
                >
                  <FieldLabel>
                    Container image
                    <AutocompleteInput
                      placeholder="e.g. docker.io/library/node:latest"
                      onBlur={field.handleBlur}
                    />
                  </FieldLabel>

                  <AutocompletePortal>
                    <AutocompletePositioner>
                      <AutocompletePopup>
                        <AutocompleteList>
                          {(image: Image) => {
                            return (
                              <AutocompleteItem key={image.url} value={image}>
                                {image.name} ({image.url})
                              </AutocompleteItem>
                            );
                          }}
                        </AutocompleteList>
                      </AutocompletePopup>
                    </AutocompletePositioner>
                  </AutocompletePortal>
                </AutocompleteRoot>

                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="instanceType"
          validators={{
            onChange: ({ value, fieldApi }) => {
              if (fieldApi.state.meta.isDirty && fieldApi.state.meta.isBlurred) {
                return !value ? 'Required' : undefined;
              }
              return undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <FieldLabel>Instance type</FieldLabel>
                <SelectRoot
                  items={INSTANCE_TYPES}
                  value={field.state.value || null}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger className="w-48" onBlur={field.handleBlur}>
                    <SelectValue />
                    <SelectIcon>
                      <ChevronsUpDown />
                    </SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectPositioner>
                      <SelectPopup>
                        <SelectScrollUpArrow />
                        <SelectList>
                          {INSTANCE_TYPES.map(({ label, value }) => {
                            return (
                              <SelectItem key={value} value={value}>
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
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="cpuCores"
          validators={{
            onChange: ({ value }) => {
              return value > 16 ? 'Pro plan required for over 16 cores' : undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <SliderRoot
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onValueCommitted={(newValue) => field.handleChange(Math.min(newValue, 16))}
                  thumbAlignment="edge"
                  min={1}
                  max={32}
                  className="w-72 gap-y-2"
                >
                  <FieldLabel>vCPU Cores</FieldLabel>
                  <SliderValue className="col-start-2 text-end" />
                  <SliderControl>
                    <SliderTrack>
                      <SliderIndicator />
                      <SliderThumb onBlur={field.handleBlur} />
                    </SliderTrack>
                  </SliderControl>
                </SliderRoot>
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="cpuUtilization"
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <FieldsetRoot
                  render={
                    <SliderRoot
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      onValueCommitted={(newValue) => field.handleChange(newValue)}
                      thumbAlignment="edge"
                      min={0}
                      max={1}
                      step={0.01}
                      format={{
                        style: 'percent',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      className="w-72 gap-y-2"
                    />
                  }
                >
                  <FieldsetLegend>CPU utilization range</FieldsetLegend>
                  <SliderValue className="col-start-2 text-end" />
                  <SliderControl>
                    <SliderTrack>
                      <SliderIndicator />
                      <SliderThumb index={0} onBlur={field.handleBlur} />
                      <SliderThumb index={1} onBlur={field.handleBlur} />
                    </SliderTrack>
                  </SliderControl>
                </FieldsetRoot>
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="numOfInstances"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (!fieldApi.state.meta.isDirty) {
                return undefined;
              }
              if (!value) {
                return 'Required';
              }
              return value > 32 ? 'Pro plan required' : undefined;
            },
            onChange: ({ value, fieldApi }) => {
              // revalidate on change
              if (fieldApi.state.meta.isDirty && fieldApi.state.meta.isBlurred && value) {
                fieldApi.setErrorMap({ onBlur: value > 32 ? 'Pro plan required' : undefined });
              }
              return undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid}>
                <NumberFieldRoot
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  min={1}
                  max={64}
                >
                  <FieldLabel>No. of instances</FieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldDecrement>
                      <Minus />
                    </NumberFieldDecrement>
                    <NumberFieldInput className="!w-16" onBlur={field.handleBlur} />
                    <NumberFieldIncrement>
                      <Plus />
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberFieldRoot>
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="storageType"
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid} className="mt-3">
                <FieldsetRoot
                  render={
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(newValue) => field.handleChange(newValue as string)}
                      className="gap-4"
                    />
                  }
                >
                  <FieldsetLegend className="-mt-px">Storage type</FieldsetLegend>
                  <FieldLabel>
                    <Radio value="ssd">
                      <RadioIndicator />
                    </Radio>
                    SSD
                  </FieldLabel>
                  <FieldLabel>
                    <Radio value="hdd">
                      <RadioIndicator />
                    </Radio>
                    HDD
                  </FieldLabel>
                </FieldsetRoot>
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <FormField
          name="backupSchedule"
          validators={{
            onBlur: ({ value, fieldApi }) => {
              if (fieldApi.state.meta.isDirty && fieldApi.state.meta.isBlurred) {
                return value.length > 0 ? undefined : 'Required';
              }
              return undefined;
            },
          }}
          children={(field) => {
            return (
              <FieldRoot name={field.name} invalid={!field.state.meta.isValid} className="mt-2">
                <FieldsetRoot
                  render={
                    <CheckboxGroup value={field.state.value} onValueChange={field.handleChange} />
                  }
                >
                  <FieldsetLegend className="mb-2">Backup schedule</FieldsetLegend>
                  <div className="flex gap-4">
                    {['daily', 'weekly', 'monthly'].map((val) => {
                      return (
                        <FieldLabel key={val} className="capitalize">
                          <Checkbox value={val} onBlur={field.handleBlur}>
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
                <FieldError match={!field.state.meta.isValid}>
                  {field.state.meta.errors.join(',')}
                </FieldError>
              </FieldRoot>
            );
          }}
        />

        <Button type="submit" className="mt-4">
          Save
        </Button>
      </Form>
    </div>
  );
}

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

interface Image {
  url: string;
  name: string;
}

const IMAGES: Image[] = [
  { url: 'docker.io/library/nginx:1.29-alpine', name: 'nginx:1.29-alpine' },
  { url: 'docker.io/library/node:22-slim', name: 'node:22-slim' },
  { url: 'docker.io/library/postgres:18', name: 'postgres:18' },
  { url: 'docker.io/library/redis:8.2.2-alpine', name: 'redis:8.2.2-alpine' },
  { url: 'docker.io/library/rabbitmq:4.1.4-alpine', name: 'rabbitmq:4.1.4-alpine' },
];

const CONTAINER_URL_PATTERN = /^(?:https?:\/\/)?[\w.-]+(?:\/[\w.-]+)+(?::[\w.-]+)?$/;

function cartesian<T extends string[][]>(...arrays: T): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]],
  );
}

const REGIONS = cartesian(['us', 'eu'], ['central', 'east', 'west'], ['1', '2', '3', '4']).map(
  (v) => v.join('-'),
);

const INSTANCE_TYPES = [
  { label: 'Pick instance type', value: null },
  ...cartesian(['t', 'm'], ['1', '2'], ['small', 'medium', 'large'])
    .map((val1) => val1.join('.').replace('.', ''))
    .map((val2) => ({
      label: val2,
      value: val2,
    })),
];
