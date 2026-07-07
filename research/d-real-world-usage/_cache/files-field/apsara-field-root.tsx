'use client';

import { Field as FieldPrimitive } from '@base-ui/react/field';
import { cx } from 'class-variance-authority';
import { createContext, ReactNode } from 'react';
import styles from './field.module.css';
import { FieldLabel } from './field-misc';

export interface FieldProps extends FieldPrimitive.Root.Props {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

export interface FieldContextValue {
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

export function FieldRoot({
  label,
  description,
  error,
  required = true,
  className,
  children,
  invalid,
  disabled,
  ref,
  ...props
}: FieldProps) {
  const isInvalid = invalid ?? !!error;

  return (
    <FieldContext.Provider value={{ invalid: isInvalid, disabled, required }}>
      <FieldPrimitive.Root
        ref={ref}
        className={cx(styles.field, className)}
        invalid={isInvalid}
        disabled={disabled}
        {...props}
      >
        {label && <FieldLabel required={required}>{label}</FieldLabel>}
        <div className={styles.control}>{children}</div>
        {error && (
          <FieldPrimitive.Error className={styles.error} match>
            {error}
          </FieldPrimitive.Error>
        )}
        {!error && description && (
          <FieldPrimitive.Description className={styles.description}>
            {description}
          </FieldPrimitive.Description>
        )}
      </FieldPrimitive.Root>
    </FieldContext.Provider>
  );
}
