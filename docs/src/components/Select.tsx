import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import clsx from 'clsx';
import { ChevronDownIcon } from '../icons/ChevronDown';
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
      <Select.Icon render={<ChevronDownIcon className="-mt-[0.5px] -ml-0.5" />} />
    </Select.Trigger>
  );
}

export function Popup({ children, className, ...props }: Select.Positioner.Props) {
  return (
    <Select.Positioner alignment="center" sideOffset={7} className="SelectPositioner" {...props}>
      <Select.Popup className={clsx('SelectPopup', className)}>{children}</Select.Popup>

      {/* Used on mobile */}
      <Select.Arrow
        className="SelectArrow"
        render={
          <svg width="20" height="8" viewBox="0 0 20 8" xmlns="http://www.w3.org/2000/svg">
            <path
              className="SelectArrowFill"
              d="M9.66437 0.602068L4.80758 4.97318C4.07308 5.63423 3.11989 6 2.13172 6H0V8H20V6H18.5349C17.5468 6 16.5936 5.63423 15.8591 4.97318L11.0023 0.602068C10.622 0.259794 10.0447 0.259793 9.66437 0.602068Z"
            />
            <path
              fill="none"
              className="SelectArrowStroke"
              d="M10.3333 1.34537L5.47655 5.71648C4.55842 6.54279 3.36693 7.00001 2.13172 7.00001H1H0V6.00001H2.13172C3.11989 6.00001 4.07308 5.63423 4.80758 4.97318L9.66437 0.602073C10.0447 0.259799 10.622 0.259799 11.0023 0.602073L15.8591 4.97318C16.5936 5.63423 17.5468 6.00001 18.5349 6.00001H20V7.00001H19H18.5349C17.2997 7.00001 16.1082 6.54279 15.1901 5.71648L10.3333 1.34537Z"
            />
          </svg>
        }
      />
    </Select.Positioner>
  );
}

export function Option({ children, className, ...props }: Select.Option.Props) {
  return (
    <Select.Option className={clsx('SelectOption', className)} {...props}>
      <Select.OptionIndicator
        className="SelectOptionIndicator"
        render={<ThickCheckIcon width="10" height="10" />}
      />
      <Select.OptionText className="SelectOptionText">{children}</Select.OptionText>
    </Select.Option>
  );
}
