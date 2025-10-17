import * as React from 'react';
import clsx from 'clsx';
import { Field as BField } from '@base-ui-components/react/field';
import { Fieldset as BFieldset } from '@base-ui-components/react/fieldset';
import { Form as BForm } from '@base-ui-components/react/form';
import { Combobox as BCombobox } from '@base-ui-components/react/combobox';
import { Autocomplete as BAutocomplete } from '@base-ui-components/react/autocomplete';
import { Select as BSelect } from '@base-ui-components/react/select';
import { Slider as BSlider } from '@base-ui-components/react/slider';
import { NumberField as BNumberField } from '@base-ui-components/react/number-field';
import { Radio as BRadio } from '@base-ui-components/react/radio';
import { RadioGroup as BRadioGroup } from '@base-ui-components/react/radio-group';
import { Checkbox as BCheckbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup as BCheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Switch as BSwitch } from '@base-ui-components/react/switch';
import { X } from 'lucide-react';

export function SwitchRoot({ className, ...props }: BSwitch.Root.Props) {
  return (
    <BSwitch.Root
      className={clsx(
        'Switch',
        'relative flex h-6 w-10 rounded-full bg-gradient-to-r from-gray-700 from-35% to-gray-200 to-65% bg-[length:6.5rem_100%] bg-[100%_0%] bg-no-repeat p-px shadow-[inset_0_1.5px_2px] shadow-gray-200 outline outline-1 -outline-offset-1 outline-gray-200 transition-[background-position,box-shadow] duration-[125ms] ease-[cubic-bezier(0.26,0.75,0.38,0.45)] before:absolute before:rounded-full before:outline-offset-2 before:outline-blue-800 focus-visible:before:inset-0 focus-visible:before:outline focus-visible:before:outline-2 active:bg-gray-100 data-[checked]:bg-[0%_0%] data-[checked]:active:bg-gray-500 dark:from-gray-500 dark:shadow-black/75 dark:outline-white/15 dark:data-[checked]:shadow-none',
        className,
      )}
      {...props}
    />
  );
}

export function SwitchThumb({ className, ...props }: BSwitch.Thumb.Props) {
  return (
    <BSwitch.Thumb
      className={clsx(
        'aspect-square h-full rounded-full bg-white shadow-[0_0_1px_1px,0_1px_1px,1px_2px_4px_-1px] shadow-gray-100 transition-transform duration-150 data-[checked]:translate-x-4 dark:shadow-black/25',
        className,
      )}
      {...props}
    />
  );
}

export function CheckboxGroup({ className, ...props }: BCheckboxGroup.Props) {
  return (
    <BCheckboxGroup
      className={clsx('flex flex-col items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: BCheckbox.Root.Props) {
  return (
    <BCheckbox.Root
      className={clsx(
        'Checkbox',
        'flex size-5 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function CheckboxIndicator({ className, ...props }: BCheckbox.Indicator.Props) {
  return (
    <BCheckbox.Indicator
      className={clsx('flex text-gray-50 data-[unchecked]:hidden', className)}
      {...props}
    />
  );
}

export function RadioGroup({ className, ...props }: BRadioGroup.Props) {
  return (
    <BRadioGroup
      className={clsx('w-full flex flex-row items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}

export function Radio({ className, ...props }: BRadio.Root.Props) {
  return (
    <BRadio.Root
      className={clsx(
        'Radio',
        'flex size-5 items-center justify-center rounded-full focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[checked]:bg-gray-900 data-[unchecked]:border data-[unchecked]:border-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function RadioIndicator({ className, ...props }: BRadio.Indicator.Props) {
  return (
    <BRadio.Indicator
      className={clsx(
        'flex before:size-2 before:rounded-full before:bg-gray-50 data-[unchecked]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export function NumberFieldRoot({ className, ...props }: BNumberField.Root.Props) {
  return (
    <BNumberField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />
  );
}

export function NumberFieldGroup({ className, ...props }: BNumberField.Group.Props) {
  return <BNumberField.Group className={clsx('flex', className)} {...props} />;
}

export function NumberFieldDecrement({ className, ...props }: BNumberField.Decrement.Props) {
  return (
    <BNumberField.Decrement
      className={clsx(
        'flex size-10 items-center justify-center rounded-tl-md rounded-bl-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}

export const NumberFieldInput = React.forwardRef<HTMLInputElement, BNumberField.Input.Props>(
  function NumberFieldInput(
    { className, ...props }: BNumberField.Input.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <BNumberField.Input
        ref={forwardedRef}
        className={clsx(
          'h-10 w-24 border-t border-b border-gray-200 text-center text-base text-gray-900 tabular-nums focus:z-1 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
          className,
        )}
        {...props}
      />
    );
  },
);

export function NumberFieldIncrement({ className, ...props }: BNumberField.Increment.Props) {
  return (
    <BNumberField.Increment
      className={clsx(
        'flex size-10 items-center justify-center rounded-tr-md rounded-br-md border border-gray-200 bg-gray-50 bg-clip-padding text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}

export function SliderRoot({ className, ...props }: BSlider.Root.Props<any>) {
  return <BSlider.Root className={clsx('grid grid-cols-2', className)} {...props} />;
}

export function SliderValue({ className, ...props }: BSlider.Value.Props) {
  return (
    <BSlider.Value className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
}

export function SliderControl({ className, ...props }: BSlider.Control.Props) {
  return (
    <BSlider.Control
      className={clsx('flex col-span-2 touch-none items-center py-3 select-none', className)}
      {...props}
    />
  );
}

export function SliderTrack({ className, ...props }: BSlider.Track.Props) {
  return (
    <BSlider.Track
      className={clsx(
        'h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200 select-none',
        className,
      )}
      {...props}
    />
  );
}

export function SliderIndicator({ className, ...props }: BSlider.Indicator.Props) {
  return (
    <BSlider.Indicator className={clsx('rounded bg-gray-700 select-none', className)} {...props} />
  );
}

export function SliderThumb({ className, ...props }: BSlider.Thumb.Props) {
  return (
    <BSlider.Thumb
      className={clsx(
        'size-4 rounded-full bg-white outline outline-gray-300 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

export function SelectRoot(props: BSelect.Root.Props<any>) {
  return <BSelect.Root {...props} />;
}

export function SelectTrigger({ className, ...props }: BSelect.Trigger.Props) {
  return (
    <BSelect.Trigger
      className={clsx(
        'flex h-10 min-w-36 items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline  focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default not-[[data-filled]]:text-gray-600 bg-[canvas]',
        className,
      )}
      {...props}
    />
  );
}

export function SelectValue({ className, ...props }: BSelect.Value.Props) {
  return <BSelect.Value className={clsx('', className)} {...props} />;
}

export function SelectIcon({ className, ...props }: BSelect.Icon.Props) {
  return <BSelect.Icon className={clsx('flex', className)} {...props} />;
}

export function SelectPortal(props: BSelect.Portal.Props) {
  return <BSelect.Portal {...props} />;
}

export function SelectPositioner({ className, ...props }: BSelect.Positioner.Props) {
  return (
    <BSelect.Positioner
      className={clsx('outline-none select-none z-10', className)}
      sideOffset={8}
      {...props}
    />
  );
}

export function SelectPopup({ className, ...props }: BSelect.Popup.Props) {
  return (
    <BSelect.Popup
      className={clsx(
        'group origin-[var(--transform-origin)] bg-clip-padding rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:outline-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function SelectScrollUpArrow({ className, ...props }: BSelect.ScrollUpArrow.Props) {
  return (
    <BSelect.ScrollUpArrow
      className={clsx(
        "top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute data-[side=none]:before:top-[-100%] before:left-0 before:h-full before:w-full before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

export function SelectScrollDownArrow({ className, ...props }: BSelect.ScrollDownArrow.Props) {
  return (
    <BSelect.ScrollDownArrow
      className={clsx(
        "bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:bottom-[-100%]",
        className,
      )}
      {...props}
    />
  );
}

export function SelectList({ className, ...props }: BSelect.List.Props) {
  return (
    <BSelect.List
      className={clsx(
        'relative py-1 scroll-py-6 overflow-y-auto max-h-[var(--available-height)]',
        className,
      )}
      {...props}
    />
  );
}

export function SelectItem({ className, ...props }: BSelect.Item.Props) {
  return (
    <BSelect.Item
      className={clsx(
        'grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]',
        className,
      )}
      {...props}
    />
  );
}

export function SelectItemIndicator({ className, ...props }: BSelect.ItemIndicator.Props) {
  return <BSelect.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

export function SelectItemText({ className, ...props }: BSelect.ItemText.Props) {
  return <BSelect.ItemText className={clsx('col-start-2', className)} {...props} />;
}

export function AutocompleteRoot(props: BAutocomplete.Root.Props<any>) {
  return <BAutocomplete.Root {...props} />;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, BAutocomplete.Input.Props>(
  function AutocompleteInput(
    { className, ...props }: BAutocomplete.Input.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <BAutocomplete.Input
        ref={forwardedRef}
        className={clsx(
          'bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
          className,
        )}
        {...props}
      />
    );
  },
);

export function AutocompletePortal(props: BAutocomplete.Portal.Props) {
  return <BAutocomplete.Portal {...props} />;
}

export function AutocompletePositioner({ className, ...props }: BAutocomplete.Positioner.Props) {
  return (
    <BAutocomplete.Positioner
      className={clsx('outline-none data-[empty]:hidden', className)}
      sideOffset={4}
      {...props}
    />
  );
}

export function AutocompletePopup({ className, ...props }: BAutocomplete.Popup.Props) {
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

export function AutocompleteList(props: BAutocomplete.List.Props) {
  return <BAutocomplete.List {...props} />;
}

export function AutocompleteItem({ className, ...props }: BAutocomplete.Item.Props) {
  return (
    <BAutocomplete.Item
      className={clsx(
        'flex flex-col gap-0.25 cursor-default py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-900',
        className,
      )}
      {...props}
    />
  );
}

export function ComboboxRoot(props: BCombobox.Root.Props<any, any>) {
  return <BCombobox.Root {...props} />;
}

export const ComboboxInput = React.forwardRef<HTMLInputElement, BCombobox.Input.Props>(
  function ComboboxInput(
    { className, ...props }: BCombobox.Input.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <BCombobox.Input
        ref={forwardedRef}
        className={clsx(
          'h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline focus:-outline-offset-1 focus:outline-blue-800',
          className,
        )}
        {...props}
      />
    );
  },
);

export function ComboboxClear({ className, ...props }: BCombobox.Clear.Props) {
  return (
    <BCombobox.Clear
      className={clsx(
        'flex h-10 w-6 items-center justify-center rounded bg-transparent p-0',
        className,
      )}
      {...props}
    >
      <X className="size-4" />
    </BCombobox.Clear>
  );
}

export function ComboboxTrigger({ className, ...props }: BCombobox.Trigger.Props) {
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

export function ComboboxPortal(props: BCombobox.Portal.Props) {
  return <BCombobox.Portal {...props} />;
}

export function ComboboxPositioner({ className, ...props }: BCombobox.Positioner.Props) {
  return (
    <BCombobox.Positioner className={clsx('outline-none', className)} sideOffset={4} {...props} />
  );
}

export function ComboboxPopup({ className, ...props }: BCombobox.Popup.Props) {
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

export function ComboboxEmpty({ className, ...props }: BCombobox.Empty.Props) {
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

export function ComboboxList(props: BCombobox.List.Props) {
  return <BCombobox.List /* className={clsx('', className)} */ {...props} />;
}

export function ComboboxItem({ className, ...props }: BCombobox.Item.Props) {
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

export function ComboboxItemIndicator({ className, ...props }: BCombobox.ItemIndicator.Props) {
  return <BCombobox.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

export function Form({ className, ...props }: BForm.Props) {
  return (
    <BForm
      className={clsx('flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5', className)}
      {...props}
    />
  );
}

export function FieldRoot({ className, ...props }: BField.Root.Props) {
  return <BField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />;
}

export function FieldLabel({ className, ...props }: BField.Label.Props) {
  return (
    <BField.Label
      className={clsx(
        'text-sm font-medium text-gray-900 has-[.Checkbox]:flex has-[.Checkbox]:items-center has-[.Checkbox]:gap-2 has-[.Radio]:flex has-[.Radio]:items-center has-[.Radio]:gap-2 has-[.Switch]:flex has-[.Switch]:items-center has-[.Radio]:font-normal',
        className,
      )}
      {...props}
    />
  );
}

export function FieldDescription({ className, ...props }: BField.Description.Props) {
  return <BField.Description className={clsx('text-sm text-gray-600', className)} {...props} />;
}

export const FieldControl = React.forwardRef<HTMLInputElement, BField.Control.Props>(
  function FieldControl(
    { className, ...props }: BField.Control.Props,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) {
    return (
      <BField.Control
        ref={forwardedRef}
        className={clsx(
          'h-10 w-full max-w-xs rounded-md bg-[canvas] border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
          className,
        )}
        {...props}
      />
    );
  },
);

export function FieldError({ className, ...props }: BField.Error.Props) {
  return <BField.Error className={clsx('text-sm text-red-800', className)} {...props} />;
}

export function FieldsetRoot(props: BFieldset.Root.Props) {
  return <BFieldset.Root {...props} />;
}

export function FieldsetLegend({ className, ...props }: BFieldset.Legend.Props) {
  return (
    <BFieldset.Legend className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
}

export function Button({ className, ...props }: React.ComponentPropsWithoutRef<'button'>) {
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
