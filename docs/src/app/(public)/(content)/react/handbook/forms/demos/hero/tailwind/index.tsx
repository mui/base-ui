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
import { Toast as BToast } from '@base-ui-components/react/toast';
import { ChevronDown, ChevronsUpDown, Check, X, Plus, Minus } from 'lucide-react';

function ExampleForm() {
  const toastManager = BToast.useToastManager();
  return (
    <Form
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const entries = Object.fromEntries(formData as any);
        entries.backupSchedule = formData.getAll('backupSchedule');
        entries.scalingThreshold = formData.getAll('scalingThreshold');
        toastManager.add({
          title: 'Form submitted',
          description: 'The form contains these values:',
          data: entries,
        });
      }}
    >
      <FieldRoot name="serverName">
        <FieldLabel>Server name</FieldLabel>
        <FieldControl
          defaultValue=""
          placeholder="e.g. api-server-01"
          required
          pattern=".*[A-Za-z].*"
        />
        <FieldError />
      </FieldRoot>
      <FieldRoot name="region">
        <ComboboxRoot items={REGIONS} required>
          <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
            <FieldLabel>Region</FieldLabel>
            <ComboboxInput placeholder="e.g. eu-central-1" />
            <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
              <ComboboxClear />
              <ComboboxTrigger>
                <ChevronDown className="size-4" />
              </ComboboxTrigger>
            </div>
          </div>
          <ComboboxPortal>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxEmpty>No matches</ComboboxEmpty>
                <ComboboxList>
                  {(region: string) => {
                    return (
                      <ComboboxItem key={region} value={region}>
                        <ComboboxItemIndicator>
                          <Check className="size-3" />
                        </ComboboxItemIndicator>
                        <div className="col-start-2">{region}</div>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxPopup>
            </ComboboxPositioner>
          </ComboboxPortal>
        </ComboboxRoot>
        <FieldError />
      </FieldRoot>
      <FieldRoot name="containerImage">
        <AutocompleteRoot
          items={IMAGES}
          mode="both"
          itemToStringValue={(itemValue: Image) => itemValue.url}
          required
        >
          <FieldLabel>Container image</FieldLabel>
          <FieldDescription>Provide a registry URL including tags</FieldDescription>
          <AutocompleteInput placeholder="e.g. docker.io/library/node:latest" />

          <AutocompletePortal>
            <AutocompletePositioner>
              <AutocompletePopup>
                <AutocompleteList>
                  {(image: Image) => {
                    return (
                      <AutocompleteItem key={image.url} value={image}>
                        <span className="text-base leading-6">{image.name}</span>
                        <span className="font-mono whitespace-nowrap text-xs leading-4 opacity-80">
                          {image.url}
                        </span>
                      </AutocompleteItem>
                    );
                  }}
                </AutocompleteList>
              </AutocompletePopup>
            </AutocompletePositioner>
          </AutocompletePortal>
        </AutocompleteRoot>
        <FieldError />
      </FieldRoot>
      <FieldRoot name="serverType">
        <FieldLabel>Server type</FieldLabel>
        <SelectRoot items={SERVER_TYPES} required>
          <SelectTrigger className="w-48">
            <SelectValue />
            <SelectIcon>
              <ChevronsUpDown className="size-4" />
            </SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectScrollUpArrow />
                <SelectList>
                  {SERVER_TYPES.map(({ label, value }) => {
                    return (
                      <SelectItem key={value} value={value}>
                        <SelectItemIndicator>
                          <Check className="size-3" />
                        </SelectItemIndicator>
                        <SelectItemText>{label}</SelectItemText>
                      </SelectItem>
                    );
                  })}
                </SelectList>
                <SelectScrollDownArrow />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
        <FieldError />
      </FieldRoot>
      <FieldRoot name="numOfInstances">
        <NumberFieldRoot defaultValue={undefined} min={1} max={64} required>
          <FieldLabel>Number of instances</FieldLabel>
          <NumberFieldGroup>
            <NumberFieldDecrement>
              <Minus className="size-4" />
            </NumberFieldDecrement>
            <NumberFieldInput className="!w-16" />
            <NumberFieldIncrement>
              <Plus className="size-4" />
            </NumberFieldIncrement>
          </NumberFieldGroup>
        </NumberFieldRoot>
        <FieldError />
      </FieldRoot>
      <FieldRoot name="scalingThreshold">
        <FieldsetRoot
          render={
            <SliderRoot
              defaultValue={[0.2, 0.8]}
              thumbAlignment="edge"
              min={0}
              max={1}
              step={0.01}
              format={{
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }}
              className="w-98/100 gap-y-2"
            />
          }
        >
          <FieldsetLegend>Scaling threshold</FieldsetLegend>
          <SliderValue className="col-start-2 text-end" />
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb index={0} />
              <SliderThumb index={1} />
            </SliderTrack>
          </SliderControl>
        </FieldsetRoot>
      </FieldRoot>
      <FieldRoot name="storageType" className="mt-3">
        <FieldsetRoot render={<RadioGroup className="gap-4" defaultValue="ssd" />}>
          <FieldsetLegend className="-mt-px">Storage type</FieldsetLegend>
          <FieldLabel>
            <Radio value="ssd">
              <RadioIndicator />
            </Radio>
            SSD
          </FieldLabel>
          <FieldLabel>
            <Radio value="hdd">
              <RadioIndicator />
            </Radio>
            HDD
          </FieldLabel>
        </FieldsetRoot>
      </FieldRoot>
      <FieldRoot name="restartOnFailure">
        <FieldLabel className="flex flex-row gap-4">
          Restart on failure
          <SwitchRoot defaultChecked>
            <SwitchThumb />
          </SwitchRoot>
        </FieldLabel>
      </FieldRoot>
      <FieldRoot name="backupSchedule">
        <FieldsetRoot render={<CheckboxGroup />}>
          <FieldsetLegend className="mb-2">Backup schedule</FieldsetLegend>
          <div className="flex gap-4">
            {['daily', 'weekly', 'monthly'].map((val) => {
              return (
                <FieldLabel key={val} className="capitalize">
                  <Checkbox value={val}>
                    <CheckboxIndicator>
                      <Check className="size-3" />
                    </CheckboxIndicator>
                  </Checkbox>
                  {val}
                </FieldLabel>
              );
            })}
          </div>
        </FieldsetRoot>
      </FieldRoot>
      <Button type="submit" className="mt-4">
        Launch server
      </Button>
    </Form>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ExampleForm />
    </ToastProvider>
  );
}

function SwitchRoot({ className, ...props }: BSwitch.Root.Props) {
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

function SwitchThumb({ className, ...props }: BSwitch.Thumb.Props) {
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

function CheckboxGroup({ className, ...props }: BCheckboxGroup.Props) {
  return (
    <BCheckboxGroup
      className={clsx('flex flex-col items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}

function Checkbox({ className, ...props }: BCheckbox.Root.Props) {
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

function CheckboxIndicator({ className, ...props }: BCheckbox.Indicator.Props) {
  return (
    <BCheckbox.Indicator
      className={clsx('flex text-gray-50 data-[unchecked]:hidden', className)}
      {...props}
    />
  );
}

function RadioGroup({ className, ...props }: BRadioGroup.Props) {
  return (
    <BRadioGroup
      className={clsx('w-full flex flex-row items-start gap-1 text-gray-900', className)}
      {...props}
    />
  );
}

function Radio({ className, ...props }: BRadio.Root.Props) {
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

function RadioIndicator({ className, ...props }: BRadio.Indicator.Props) {
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

function NumberFieldRoot({ className, ...props }: BNumberField.Root.Props) {
  return (
    <BNumberField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />
  );
}

function NumberFieldGroup({ className, ...props }: BNumberField.Group.Props) {
  return <BNumberField.Group className={clsx('flex', className)} {...props} />;
}

function NumberFieldDecrement({ className, ...props }: BNumberField.Decrement.Props) {
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

function NumberFieldInput({ className, ...props }: BNumberField.Input.Props) {
  return (
    <BNumberField.Input
      className={clsx(
        'h-10 w-24 border-t border-b border-gray-200 text-center text-base text-gray-900 tabular-nums focus:z-1 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldIncrement({ className, ...props }: BNumberField.Increment.Props) {
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

function SliderRoot({ className, ...props }: BSlider.Root.Props<any>) {
  return <BSlider.Root className={clsx('grid grid-cols-2', className)} {...props} />;
}

function SliderValue({ className, ...props }: BSlider.Value.Props) {
  return (
    <BSlider.Value className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
}

function SliderControl({ className, ...props }: BSlider.Control.Props) {
  return (
    <BSlider.Control
      className={clsx('flex col-span-2 touch-none items-center py-3 select-none', className)}
      {...props}
    />
  );
}

function SliderTrack({ className, ...props }: BSlider.Track.Props) {
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

function SliderIndicator({ className, ...props }: BSlider.Indicator.Props) {
  return (
    <BSlider.Indicator className={clsx('rounded bg-gray-700 select-none', className)} {...props} />
  );
}

function SliderThumb({ className, ...props }: BSlider.Thumb.Props) {
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

function SelectRoot(props: BSelect.Root.Props<any>) {
  return <BSelect.Root {...props} />;
}

function SelectTrigger({ className, ...props }: BSelect.Trigger.Props) {
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

function SelectValue({ className, ...props }: BSelect.Value.Props) {
  return <BSelect.Value className={clsx('', className)} {...props} />;
}

function SelectIcon({ className, ...props }: BSelect.Icon.Props) {
  return <BSelect.Icon className={clsx('flex', className)} {...props} />;
}

function SelectPortal(props: BSelect.Portal.Props) {
  return <BSelect.Portal {...props} />;
}

function SelectPositioner({ className, ...props }: BSelect.Positioner.Props) {
  return (
    <BSelect.Positioner
      className={clsx('outline-none select-none z-10', className)}
      sideOffset={8}
      {...props}
    />
  );
}

function SelectPopup({ className, ...props }: BSelect.Popup.Props) {
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

function SelectScrollUpArrow({ className, ...props }: BSelect.ScrollUpArrow.Props) {
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

function SelectScrollDownArrow({ className, ...props }: BSelect.ScrollDownArrow.Props) {
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

function SelectList({ className, ...props }: BSelect.List.Props) {
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

function SelectItem({ className, ...props }: BSelect.Item.Props) {
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

function SelectItemIndicator({ className, ...props }: BSelect.ItemIndicator.Props) {
  return <BSelect.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

function SelectItemText({ className, ...props }: BSelect.ItemText.Props) {
  return <BSelect.ItemText className={clsx('col-start-2', className)} {...props} />;
}

function AutocompleteRoot(props: BAutocomplete.Root.Props<any>) {
  return <BAutocomplete.Root {...props} />;
}

function AutocompleteInput({ className, ...props }: BAutocomplete.Input.Props) {
  return (
    <BAutocomplete.Input
      className={clsx(
        'bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function AutocompletePortal(props: BAutocomplete.Portal.Props) {
  return <BAutocomplete.Portal {...props} />;
}

function AutocompletePositioner({ className, ...props }: BAutocomplete.Positioner.Props) {
  return (
    <BAutocomplete.Positioner
      className={clsx('outline-none data-[empty]:hidden', className)}
      sideOffset={4}
      {...props}
    />
  );
}

function AutocompletePopup({ className, ...props }: BAutocomplete.Popup.Props) {
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

function AutocompleteList(props: BAutocomplete.List.Props) {
  return <BAutocomplete.List {...props} />;
}

function AutocompleteItem({ className, ...props }: BAutocomplete.Item.Props) {
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

function ComboboxRoot(props: BCombobox.Root.Props<any, any>) {
  return <BCombobox.Root {...props} />;
}

function ComboboxInput({ className, ...props }: BCombobox.Input.Props) {
  return (
    <BCombobox.Input
      className={clsx(
        'h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxClear({ className, ...props }: BCombobox.Clear.Props) {
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

function ComboboxTrigger({ className, ...props }: BCombobox.Trigger.Props) {
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

function ComboboxPortal(props: BCombobox.Portal.Props) {
  return <BCombobox.Portal {...props} />;
}

function ComboboxPositioner({ className, ...props }: BCombobox.Positioner.Props) {
  return (
    <BCombobox.Positioner className={clsx('outline-none', className)} sideOffset={4} {...props} />
  );
}

function ComboboxPopup({ className, ...props }: BCombobox.Popup.Props) {
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

function ComboboxEmpty({ className, ...props }: BCombobox.Empty.Props) {
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

function ComboboxList(props: BCombobox.List.Props) {
  return <BCombobox.List /* className={clsx('', className)} */ {...props} />;
}

function ComboboxItem({ className, ...props }: BCombobox.Item.Props) {
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

function ComboboxItemIndicator({ className, ...props }: BCombobox.ItemIndicator.Props) {
  return <BCombobox.ItemIndicator className={clsx('col-start-1', className)} {...props} />;
}

function Form({ className, ...props }: BForm.Props) {
  return (
    <BForm
      className={clsx('flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5', className)}
      {...props}
    />
  );
}

function FieldRoot({ className, ...props }: BField.Root.Props) {
  return <BField.Root className={clsx('flex flex-col items-start gap-1', className)} {...props} />;
}

function FieldLabel({ className, ...props }: BField.Label.Props) {
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

function FieldDescription({ className, ...props }: BField.Description.Props) {
  return <BField.Description className={clsx('text-sm text-gray-600', className)} {...props} />;
}

function FieldControl({ className, ...props }: BField.Control.Props) {
  return (
    <BField.Control
      className={clsx(
        'h-10 w-full max-w-xs rounded-md bg-[canvas] border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:-outline-offset-1 focus:outline-blue-800',
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: BField.Error.Props) {
  return <BField.Error className={clsx('text-sm text-red-800', className)} {...props} />;
}

function FieldsetRoot(props: BFieldset.Root.Props) {
  return <BFieldset.Root {...props} />;
}

function FieldsetLegend({ className, ...props }: BFieldset.Legend.Props) {
  return (
    <BFieldset.Legend className={clsx('text-sm font-medium text-gray-900', className)} {...props} />
  );
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

function ToastList() {
  const { toasts } = BToast.useToastManager();
  return toasts.map((toast) => (
    <BToast.Root
      key={toast.id}
      toast={toast}
      className="[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] rounded-lg border border-gray-200 bg-gray-50 bg-clip-padding p-4 shadow-lg after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0  data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] h-[var(--height)] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]"
    >
      <BToast.Content className="overflow-hidden transition-opacity [transition-duration:250ms] data-[behind]:pointer-events-none data-[behind]:opacity-0 data-[expanded]:pointer-events-auto data-[expanded]:opacity-100">
        <BToast.Title className="text-[0.975rem] leading-5 font-medium" />
        <BToast.Description className="text-[0.925rem] leading-5 text-gray-700" />
        <div className="text-xs mt-2 p-3 py-2 bg-gray-100 text-gray-900 font-medium rounded-md">
          <pre className="whitespace-pre-wrap">{JSON.stringify(toast.data, null, 2)}</pre>
        </div>
        <BToast.Close
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="size-4" />
        </BToast.Close>
      </BToast.Content>
    </BToast.Root>
  ));
}

function ToastProvider(props: { children: React.ReactNode }) {
  return (
    <BToast.Provider>
      {props.children}
      <BToast.Portal>
        <BToast.Viewport className="fixed z-10 top-auto right-[1rem] bottom-[1rem] mx-auto flex w-[250px] sm:right-[2rem] sm:bottom-[2rem] sm:w-[360px]">
          <ToastList />
        </BToast.Viewport>
      </BToast.Portal>
    </BToast.Provider>
  );
}

function cartesian<T extends string[][]>(...arrays: T): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]],
  );
}

const REGIONS = cartesian(['us', 'eu', 'ap'], ['central', 'east', 'west'], ['1', '2', '3']).map(
  (v) => v.join('-'),
);

interface Image {
  url: string;
  name: string;
}

const IMAGES: Image[] = [
  { url: 'docker.io/library/nginx:1.29-alpine', name: 'nginx:1.29-alpine' },
  { url: 'docker.io/library/node:22-slim', name: 'node:22-slim' },
  { url: 'docker.io/library/postgres:18', name: 'postgres:18' },
  { url: 'docker.io/library/redis:8.2.2-alpine', name: 'redis:8.2.2-alpine' },
];

const SERVER_TYPES = [
  { label: 'Select server type', value: null },
  ...cartesian(['t', 'm'], ['1', '2'], ['small', 'medium', 'large']).map((v) => {
    const value = v.join('.').replace('.', '');
    return {
      label: value,
      value,
    };
  }),
];
