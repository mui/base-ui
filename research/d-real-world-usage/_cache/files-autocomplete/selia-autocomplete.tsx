'use client';

import * as React from 'react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { cn } from '#utils';
import { cva, type VariantProps } from 'class-variance-authority';

export function Autocomplete({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Root>) {
  return <BaseAutocomplete.Root data-slot="autocomplete" {...props} />;
}

export const autocompleteInputVariants = cva(
  [
    'h-9.5 px-2.5 w-full text-foreground placeholder:text-dimmed transition-[color,box-shadow]',
    'disabled:opacity-70 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: 'bg-input',
        subtle: 'bg-input/60',
        plain: 'bg-transparent focus:outline-none',
      },
    },
    compoundVariants: [
      {
        variant: ['default', 'subtle'],
        className:
          'ring ring-input-border hover:not-[[data-disabled]]:not-[:focus]:ring-input-accent-border focus:outline-0 focus:ring-primary focus:ring-2 shadow-input rounded',
      },
    ],
    defaultVariants: {
      variant: 'default',
    },
  },
);

export function AutocompleteInput({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Input> &
  VariantProps<typeof autocompleteInputVariants>) {
  return (
    <BaseAutocomplete.Input
      data-slot="autocomplete-input"
      {...props}
      className={cn(autocompleteInputVariants({ variant, className }))}
    />
  );
}

export function AutocompletePopup({
  className,
  children,
  align,
  alignOffset,
  side,
  sideOffset,
  anchor,
  sticky,
  positionMethod,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Popup> & {
  align?: BaseAutocomplete.Positioner.Props['align'];
  alignOffset?: BaseAutocomplete.Positioner.Props['alignOffset'];
  side?: BaseAutocomplete.Positioner.Props['side'];
  sideOffset?: BaseAutocomplete.Positioner.Props['sideOffset'];
  anchor?: BaseAutocomplete.Positioner.Props['anchor'];
  sticky?: BaseAutocomplete.Positioner.Props['sticky'];
  positionMethod?: BaseAutocomplete.Positioner.Props['positionMethod'];
}) {
  return (
    <BaseAutocomplete.Portal>
      <BaseAutocomplete.Backdrop />
      <BaseAutocomplete.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset || 8}
        anchor={anchor}
        sticky={sticky}
        positionMethod={positionMethod}
      >
        <BaseAutocomplete.Popup
          data-slot="autocomplete-popup"
          {...props}
          className={cn(
            'bg-popover ring ring-popover-border rounded shadow-popover',
            'outline-none transition-[transform,scale,opacity]',
            'w-(--anchor-width) max-h-[min(var(---available-height),23rem)]',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-90',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-90',
            className,
          )}
        >
          {children}
        </BaseAutocomplete.Popup>
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  );
}

export function AutocompleteIcon({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Icon>) {
  return <BaseAutocomplete.Icon data-slot="autocomplete-icon" {...props} />;
}

export function AutocompleteClear({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Clear>) {
  return <BaseAutocomplete.Clear data-slot="autocomplete-clear" {...props} />;
}

export function AutocompleteValue({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Value>) {
  return <BaseAutocomplete.Value data-slot="autocomplete-value" {...props} />;
}

export function AutocompleteTrigger({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Trigger>) {
  return (
    <BaseAutocomplete.Trigger data-slot="autocomplete-trigger" {...props} />
  );
}

export function AutocompleteEmpty({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Empty>) {
  return (
    <BaseAutocomplete.Empty
      data-slot="autocomplete-empty"
      {...props}
      className={cn(
        'flex items-center justify-center px-3 py-2.5 text-muted text-center',
        'empty:h-0 empty:p-0 empty:hidden',
        className,
      )}
    />
  );
}

export function AutocompleteList({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.List>) {
  return (
    <BaseAutocomplete.List
      data-slot="autocomplete-list"
      {...props}
      className={cn(
        'space-y-0.5 overflow-auto empty:hidden empty:h-0 empty:p-0 outline-none dark:scheme-dark',
        'max-h-[min(23rem,var(--available-height))] overflow-y-auto dark:scheme-dark p-1',
        className,
      )}
    />
  );
}

export function AutocompleteGroup({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Group>) {
  return (
    <BaseAutocomplete.Group
      data-slot="autocomplete-group"
      {...props}
      className={cn('pb-2 last:pb-0', className)}
    />
  );
}

export function AutocompleteGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.GroupLabel>) {
  return (
    <BaseAutocomplete.GroupLabel
      data-slot="autocomplete-group-label"
      {...props}
      className={cn('px-3 py-1.5 text-sm font-medium text-dimmed', className)}
    />
  );
}

export function AutocompleteCollection({
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Collection>) {
  return (
    <BaseAutocomplete.Collection
      data-slot="autocomplete-collection"
      {...props}
    />
  );
}

export function AutocompleteRow({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Row>) {
  return (
    <div data-slot="autocomplete-row" {...props} className={cn(className)} />
  );
}

export function AutocompleteItem({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Item>) {
  return (
    <BaseAutocomplete.Item
      data-slot="autocomplete-item"
      {...props}
      className={cn(
        'flex items-center gap-3.5 text-foreground px-3 py-2.5 rounded cursor-pointer',
        'data-[highlighted]:not-[[data-disabled]]:bg-popover-accent data-[selected]:not-[[data-disabled]]:bg-popover-accent',
        'focus-visible:outline-none',
        '[&_svg:not([class*=size-])]:size-4 [&_svg:not([class*=text-])]:text-foreground',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
    />
  );
}

export function AutocompleteSeparator({
  className,
  ...props
}: React.ComponentProps<typeof BaseAutocomplete.Separator>) {
  return (
    <BaseAutocomplete.Separator
      data-slot="autocomplete-separator"
      {...props}
      className={cn('h-px my-1 bg-popover-separator', className)}
    />
  );
}
