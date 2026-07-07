import { Field as FieldBase } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Label } from "../label";

/**
 * Normalizes an error prop that may be a string or structured object
 * into the `{ message, match }` shape expected by `<Field>`.
 *
 * Returns `undefined` when the input is falsy.
 */
export function normalizeFieldError(
  error: string | { message: ReactNode; match: FieldErrorMatch } | undefined,
): { message: ReactNode; match: FieldErrorMatch } | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return { message: error, match: true };
  return error;
}

/** Field variant definitions (currently empty, reserved for future additions). */
export const KUMO_FIELD_VARIANTS = {
  // Field currently has no variant options but structure is ready for future additions
} as const;

export const KUMO_FIELD_DEFAULT_VARIANTS = {} as const;

// Derived types from KUMO_FIELD_VARIANTS
export interface KumoFieldVariantsProps {
  /**
   * When true, places the control (checkbox/switch) before the label visually.
   * When false (default), places the label before the control.
   * Used to support different layout patterns (e.g., iOS-style toggles on the right).
   */
  controlFirst?: boolean;
}

export function fieldVariants({
  controlFirst = false,
}: KumoFieldVariantsProps = {}) {
  return cn(
    // Base styles - vertical layout (default)
    "grid gap-2",

    // Horizontal layout for checkbox and switch
    // Default: Grid auto-reverses in RTL (desired)
    "has-[input[type=checkbox]]:grid-cols-[auto_1fr] has-[input[type=checkbox]]:items-center",
    "has-[[role=switch]]:grid-cols-[auto_1fr] has-[[role=switch]]:items-center",

    // Control first: use flexbox with row-reverse to flip visual order without affecting text direction
    // flex-row-reverse in LTR: Control→Label, in RTL: Label→Control (opposite of grid default)
    controlFirst && [
      "has-[input[type=checkbox]]:flex has-[input[type=checkbox]]:flex-row-reverse has-[input[type=checkbox]]:flex-wrap has-[input[type=checkbox]]:items-center",
      "has-[[role=switch]]:flex has-[[role=switch]]:flex-row-reverse has-[[role=switch]]:flex-wrap has-[[role=switch]]:items-center",
      "[&>label]:flex-1",
    ],
  );
}

/**
 * Match type for field validation errors.
 * Can be a boolean or a key from the browser's ValidityState interface.
 * Source: BaseErrorProps["match"] (ComponentPropsWithoutRef<typeof FieldBase.Error>)
 */
export type FieldErrorMatch =
  | boolean
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valid"
  | "valueMissing";

/**
 * Field component props — wraps a form control with label, description, and error message.
 *
 * @example
 * ```tsx
 * <Field label="Email" required>
 *   <Input placeholder="you@example.com" />
 * </Field>
 *
 * <Field label="Phone" required={false} description="We'll only use this for account recovery.">
 *   <Input placeholder="+1 555-0000" />
 * </Field>
 * ```
 */
export interface FieldProps extends KumoFieldVariantsProps {
  /** The form control element(s) to wrap (Input, Select, Checkbox, etc.). */
  children: ReactNode;
  /** The label content — can be a string or any React node. */
  label: ReactNode;
  /**
   * When explicitly `false`, shows gray "(optional)" text after the label.
   * When `true` or `undefined`, no indicator is shown.
   */
  required?: boolean;
  /** Tooltip content displayed next to the label via an info icon. */
  labelTooltip?: ReactNode;
  /** Validation error with a message and a browser `ValidityState` match key. */
  error?: {
    message: ReactNode;
    match: FieldErrorMatch;
  };
  /** Helper text displayed below the control (hidden when `error` is present). */
  description?: ReactNode;
  /** When `true`, places the control before the label (for checkbox/switch layouts). */
  controlFirst?: boolean;
  /**
   * When `true`, Field renders layout, description, and error but skips
   * the `<label>` element. Use when the child component provides its own
   * accessible label (e.g. Select uses Base UI's `Select.Label` to avoid
   * hover/focus coupling from native `<label>`).
   * @default false
   */
  hideLabel?: boolean;
}

/**
 * Form field wrapper that provides a label, optional description, and error display
 * around any form control. Built on Base UI Field primitives.
 *
 * @example
 * ```tsx
 * <Field label="Username">
 *   <Input placeholder="Choose a username" />
 * </Field>
 * ```
 */
export function Field({
  children,
  label,
  required,
  labelTooltip,
  error,
  description,
  controlFirst = false,
  hideLabel = false,
}: FieldProps) {
  // Show "(optional)" when required is explicitly false
  const showOptional = required === false;

  return (
    <FieldBase.Root className={fieldVariants({ controlFirst })}>
      {!hideLabel && (
        <FieldBase.Label className="m-0 select-none text-base font-medium text-kumo-default">
          <Label showOptional={showOptional} tooltip={labelTooltip} asContent>
            {label}
          </Label>
        </FieldBase.Label>
      )}
      {children}
      {error ? (
        <FieldBase.Error
          className={cn(
            "text-sm leading-snug text-kumo-danger",
            // Span full width in horizontal layout
            "col-span-full",
          )}
          match={error.match}
        >
          {error.message}
        </FieldBase.Error>
      ) : (
        description && (
          <FieldBase.Description
            className={cn(
              "text-sm leading-snug text-kumo-subtle",
              // Span full width in horizontal layout
              "col-span-full",
            )}
          >
            {description}
          </FieldBase.Description>
        )
      )}
    </FieldBase.Root>
  );
}
