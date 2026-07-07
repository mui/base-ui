"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { inputVariants } from "./input";

function Field({ className, ...props }: BaseField.Root.Props) {
  return (
    <BaseField.Root
      className={cn(
        "group relative flex flex-col gap-2",
        "has-[[data-slot=checkbox]]:flex-row has-[[data-slot=checkbox]]:items-center has-[[data-slot=checkbox]]:flex-wrap",
        "has-[[data-slot=radio]]:flex-row has-[[data-slot=radio]]:items-center has-[[data-slot=radio]]:flex-wrap",
        "has-[[data-slot=switch]]:flex-row has-[[data-slot=switch]]:items-center has-[[data-slot=switch]]:flex-wrap",
        className,
      )}
      data-slot="field"
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: BaseField.Label.Props) {
  return (
    <BaseField.Label
      className={cn(
        "inline-flex items-start gap-2 text-sm leading-none font-medium select-none transition-colors",
        "data-[disabled]:opacity-50",
        "data-[invalid]:text-destructive",
        "group-has-required:after:content-['*'] group-has-required:after:text-destructive group-has-required:after:-ml-0.5",
        "aria-required:after:content-['*'] aria-required:after:text-destructive aria-required:after:-ml-0.5",
        "[&_[data-slot=checkbox]]:-mt-px [&_[data-slot=switch]]:-mt-0.5",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldControl({
  className,
  inputSize = "default",
  variant = "default",
  ...props
}: BaseField.Control.Props & {
  inputSize?: VariantProps<typeof inputVariants>["inputSize"];
  variant?: VariantProps<typeof inputVariants>["variant"];
}) {
  return (
    <BaseField.Control
      className={cn(inputVariants({ inputSize, variant }), className)}
      data-slot="field-control"
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: BaseField.Description.Props) {
  return (
    <BaseField.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

function FieldItem({ className, ...props }: BaseField.Item.Props) {
  return (
    <BaseField.Item
      className={cn("flex items-center gap-2", className)}
      data-slot="field-item"
      {...props}
    />
  );
}

function FieldError({ className, ...props }: BaseField.Error.Props) {
  return (
    <BaseField.Error
      className={cn("text-sm text-destructive text-pretty", className)}
      data-slot="field-error"
      {...props}
    />
  );
}

const FieldValidity = BaseField.Validity;

export {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldItem,
  FieldError,
  FieldValidity,
};
