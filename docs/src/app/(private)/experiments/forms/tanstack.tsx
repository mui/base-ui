/* eslint-disable react/no-children-prop */
'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useForm } from '@tanstack/react-form';
import { Field as BField } from '@base-ui-components/react/field';
import { Form as BForm } from '@base-ui-components/react/form';
import { Combobox as BCombobox } from '@base-ui-components/react/combobox';
import { Autocomplete as BAutocomplete } from '@base-ui-components/react/autocomplete';
import { ClearIcon, CheckIcon, ChevronDownIcon } from './_icons';

export default function App() {
  const { Field: FormField, handleSubmit } = useForm({
    defaultValues: {
      serverName: '',
      staticIpAddress: '',
      region: '', // this cannot be null or `FormField` will throw a type error
      image: '',
    },
    onSubmit: async ({ value }) => {
      console.log('submit', value);
    },
  });
  return (
    <div className="w-80">
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
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
                        <ChevronDownIcon className="size-4" />
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
                                  <CheckIcon className="size-3" />
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

        <Button type="submit">Submit</Button>
      </Form>
    </div>
  );
}

function AutocompleteRoot(props: BAutocomplete.Root.Props<any>) {
  return <BAutocomplete.Root {...props} />;
}

function AutocompleteInput({ className, ...props }: BAutocomplete.Input.Props) {
  return (
    <BAutocomplete.Input
      className={clsx(
        'bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function AutocompletePortal(props: BAutocomplete.Portal.Props) {
  return <BAutocomplete.Portal {...props} />;
}

function AutocompletePositioner({ className, ...props }: BAutocomplete.Positioner.Props) {
  return (
    <BAutocomplete.Positioner
      className={clsx('outline-none data-[empty]:hidden', className)}
      sideOffset={4}
      {...props}
    />
  );
}

function AutocompletePopup({ className, ...props }: BAutocomplete.Popup.Props) {
  return (
    <BAutocomplete.Popup
      className={clsx(
        'w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300',
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteList(props: BAutocomplete.List.Props) {
  return <BAutocomplete.List {...props} />;
}

function AutocompleteItem({ className, ...props }: BAutocomplete.Item.Props) {
  return (
    <BAutocomplete.Item
      className={clsx(
        'flex cursor-default py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-900',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxRoot(props: BCombobox.Root.Props<any, any>) {
  return <BCombobox.Root {...props} />;
}

function ComboboxInput({ className, ...props }: BCombobox.Input.Props) {
  return (
    <BCombobox.Input
      className={clsx(
        'h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxClear({ className, ...props }: BCombobox.Clear.Props) {
  return (
    <BCombobox.Clear
      className={clsx(
        'flex h-10 w-6 items-center justify-center rounded bg-transparent p-0',
        className,
      )}
      {...props}
    >
      <ClearIcon className="size-4" />
    </BCombobox.Clear>
  );
}

function ComboboxTrigger({ className, ...props }: BCombobox.Trigger.Props) {
  return (
    <BCombobox.Trigger
      className={clsx(
        'flex h-10 w-6 items-center justify-center rounded bg-transparent p-0',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxPortal(props: BCombobox.Portal.Props) {
  return <BCombobox.Portal {...props} />;
}

function ComboboxPositioner({ className, ...props }: BCombobox.Positioner.Props) {
  return (
    <BCombobox.Positioner className={clsx('outline-none', className)} sideOffset={4} {...props} />
  );
}

function ComboboxPopup({ className, ...props }: BCombobox.Popup.Props) {
  return (
    <BCombobox.Popup
      className={clsx(
        'w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxEmpty({ className, ...props }: BCombobox.Empty.Props) {
  return (
    <BCombobox.Empty
      className={clsx(
        'px-4 py-2 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxList(props: BCombobox.List.Props) {
  return <BCombobox.List /* className={clsx('', className)} */ {...props} />;
}

function ComboboxItem({ className, ...props }: BCombobox.Item.Props) {
  return (
    <BCombobox.Item
      className={clsx(
        'grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({ className, ...props }: BCombobox.ItemIndicator.Props) {
  return <BCombobox.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

function Form({ className, ...props }: BForm.Props) {
  return <BForm className={clsx('flex w-full flex-col gap-4', className)} {...props} />;
}

function FieldRoot({ className, ...props }: BField.Root.Props) {
  return <BField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />;
}

function FieldLabel({ className, ...props }: BField.Label.Props) {
  return (
    <BField.Label
      className={clsx(
        'text-sm font-medium text-gray-900 has-[.Checkbox]:flex has-[.Checkbox]:items-center has-[.Checkbox]:gap-2 has-[.Radio]:flex has-[.Radio]:items-center has-[.Radio]:gap-2 has-[.Switch]:flex has-[.Switch]:items-center has-[.Switch]:gap-2 has-[.Radio]:font-normal',
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: BField.Description.Props) {
  return <BField.Description className={clsx('text-sm text-gray-600', className)} {...props} />;
}

function FieldControl({ className, ...props }: BField.Control.Props) {
  return (
    <BField.Control
      className={clsx(
        'h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: BField.Error.Props) {
  return <BField.Error className={clsx('text-sm text-red-800', className)} {...props} />;
}

function Button({ className, ...props }: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      className={clsx(
        'flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline  focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400',
        className,
      )}
      {...props}
    />
  );
}

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const REGIONS = ['us', 'eu'].flatMap((val1) => {
  return ['central', 'east', 'west'].flatMap((val2) => {
    return ['1', '2', '3', '4'].map((val3) => `${val1}-${val2}-${val3}`);
  });
});

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
