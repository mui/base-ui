import * as React from 'react';
import { Select } from '@base_ui/react/Select';
import clsx from 'clsx';
import { ChevronDownIcon } from '../icons/ChevronDown';
import { Popup as PopupComponent } from './Popup';
import { ThickCheckIcon } from '../icons/ThickCheckIcon';

export const Root = Select.Root;

interface TriggerProps extends Select.Trigger.Props {
  render: NonNullable<Select.Trigger.Props['render']>;
  ssrFallback?: string;
  placeholder?: Select.Value.Props['placeholder'];
}

export function Trigger({ className, ssrFallback, placeholder, ...props }: TriggerProps) {
  return (
    <Select.Trigger {...props}>
      <Select.Value placeholder={placeholder}>{(value) => value || ssrFallback}</Select.Value>
      <Select.Icon render={<ChevronDownIcon className="mt-px -ml-0.5" />} />
    </Select.Trigger>
  );
}

export function Popup({ children, className, ...props }: Select.Positioner.Props) {
  return (
    <Select.Positioner {...props}>
      <Select.Popup className={clsx('SelectPopup', className)} render={<PopupComponent instant />}>
        {children}
      </Select.Popup>
    </Select.Positioner>
  );
}

export function Option({ children, className, ...props }: Select.Option.Props) {
  return (
    <Select.Option className={clsx('SelectOption', className)} {...props}>
      <Select.OptionIndicator render={<ThickCheckIcon />} />
      <Select.OptionText className="SelectOptionText">{children}</Select.OptionText>
    </Select.Option>
  );
}
