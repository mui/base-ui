/* eslint-disable react/no-children-prop */
'use client';
import * as React from 'react';
import { useForm, revalidateLogic, DeepKeys, ValidationError } from '@tanstack/react-form';
import { Button, FieldControl, FieldError, FieldLabel, FieldRoot } from './_components';

interface FormValues {
  username: string;
  email: string;
}

const defaultValues: FormValues = {
  username: '',
  email: '',
};

export default function App() {
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value: formValues }) => {
      console.log('onSubmit', formValues);
    },
    onSubmitInvalid: ({ formApi }) => {
      const errorMap: Partial<Record<DeepKeys<FormValues>, ValidationError>> =
        formApi.state.errorMap.onDynamic ?? {};

      if (errorMap?.username) {
        usernameRef.current?.focus();
      } else if (errorMap?.email) {
        emailRef.current?.focus();
      }
    },
    validationLogic: revalidateLogic({
      mode: 'submit',
      modeAfterSubmission: 'change',
    }),
    validators: {
      onDynamic: ({ value: formValues }) => {
        const errors: Partial<Record<DeepKeys<FormValues>, ValidationError>> = {};

        (['username', 'email'] as const).forEach((requiredField) => {
          if (!formValues[requiredField]) {
            errors[requiredField] = 'This is a required field.';
          }
        });

        if (formValues.email && formValues.email.indexOf('@') < 1) {
          errors.email = 'Invalid email format';
        }
        return { form: errors, fields: errors };
      },
    },
  });

  return (
    <form
      className="flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <h3 className="border-b border-gray-200 pb-3 font-medium text-gray-900">
        submit validation + focus inputs on error
      </h3>
      <form.Field
        name="username"
        children={(field) => {
          return (
            <FieldRoot
              name={field.name}
              invalid={!field.state.meta.isValid}
              dirty={field.state.meta.isDirty}
              touched={field.state.meta.isTouched}
            >
              <FieldLabel>Username</FieldLabel>
              <FieldControl
                value={field.state.value}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="e.g. alice123"
                ref={usernameRef}
              />
              <FieldError match={!field.state.meta.isValid}>
                {field.state.meta.errors.join(',')}
              </FieldError>
            </FieldRoot>
          );
        }}
      />

      <form.Field
        name="email"
        children={(field) => {
          return (
            <FieldRoot
              name={field.name}
              invalid={!field.state.meta.isValid}
              dirty={field.state.meta.isDirty}
              touched={field.state.meta.isTouched}
            >
              <FieldLabel>Email</FieldLabel>
              <FieldControl
                type="email"
                value={field.state.value}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                ref={emailRef}
              />
              <FieldError match={!field.state.meta.isValid}>
                {field.state.meta.errors.join(',')}
              </FieldError>
            </FieldRoot>
          );
        }}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
