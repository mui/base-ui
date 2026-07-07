"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@/registry/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/ui/field";
import { Form, type FormValues } from "@/registry/ui/form";

const schema = z.object({
  age: z.coerce
    .number("Age must be a number")
    .positive("Age must be a positive number"),
  name: z.string().min(1, "Name is required"),
});

async function submitForm(formValues: FormValues) {
  const result = schema.safeParse(formValues);

  if (!result.success) {
    return {
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  return {
    errors: {},
  };
}

export default function FormZod() {
  const [errors, setErrors] = React.useState({});

  return (
    <Form
      aria-label="Form with Zod validation"
      errors={errors}
      onFormSubmit={async (formValues) => {
        const response = await submitForm(formValues);
        setErrors(response.errors);
      }}
    >
      <Field name="name">
        <FieldLabel>Name</FieldLabel>
        <FieldControl placeholder="Enter name" />
        <FieldError />
      </Field>
      <Field name="age">
        <FieldLabel>Age</FieldLabel>
        <FieldControl placeholder="Enter age" />
        <FieldError />
      </Field>
      <Button type="submit">Submit</Button>
    </Form>
  );
}
