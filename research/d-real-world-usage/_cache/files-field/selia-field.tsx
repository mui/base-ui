'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '#utils';

export function Field({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Root>) {
  return (
    <BaseField.Root
      data-slot="field"
      className={cn('flex gap-2 flex-col', className)}
      {...props}
    />
  );
}

export function FieldItem({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Item>) {
  return (
    <BaseField.Item
      data-slot="field-item"
      className={cn(
        'grid items-center gap-x-3 gap-y-1 not-last:mb-2.5',
        'grid-cols-[auto_1fr]',
        '[&_[data-slot=field-description]]:col-start-2',
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      data-slot="field-label"
      className={cn('text-foreground flex items-center gap-3', className)}
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Description>) {
  return (
    <BaseField.Description
      data-slot="field-description"
      className={cn('text-muted text-sm leading-relaxed', className)}
      {...props}
    />
  );
}

export function FieldError({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Error>) {
  return (
    <BaseField.Error
      data-slot="field-error"
      className={cn('text-danger', className)}
      {...props}
    />
  );
}

export function FieldValidity({
  ...props
}: React.ComponentProps<typeof BaseField.Validity>) {
  return <BaseField.Validity data-slot="field-validity" {...props} />;
}

export function FieldControl({
  ...props
}: React.ComponentProps<typeof BaseField.Control>) {
  return <BaseField.Control data-slot="field-control" {...props} />;
}
