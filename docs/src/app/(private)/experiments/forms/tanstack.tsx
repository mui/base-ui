/* eslint-disable react/no-children-prop */
'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useForm } from '@tanstack/react-form';
import { Field as BField } from '@base-ui-components/react/field';
import { Form as BForm } from '@base-ui-components/react/form';

export default function App() {
  const { Field: FormField, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      staticIpAddress: '',
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
          name="name"
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
                <FieldLabel>Name</FieldLabel>
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
                <FieldLabel>Static IPv4 Address</FieldLabel>
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

        <Button type="submit">Submit</Button>
      </Form>
    </div>
  );
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
