"use client";

import type * as React from "react";
import { Button } from "@/registry/ui/button";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/registry/ui/field";
import { Form } from "@/registry/ui/form";
import { toast } from "@/registry/ui/toast";

export default function NativeSubmitForm() {
  const handleNativeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData);

    toast.success({
      description: `${values.username} has been submitted!`,
      title: "Success",
    });
  };

  return (
    <Form
      className="flex w-full max-w-64 flex-col gap-4"
      onSubmit={handleNativeSubmit}
    >
      <Field name="username">
        <FieldLabel>Username</FieldLabel>
        <FieldControl
          defaultValue="admin"
          placeholder="e.g. alice132"
          required
          type="username"
        />
        <FieldError />
      </Field>
      <Button type="submit">Submit</Button>
    </Form>
  );
}
