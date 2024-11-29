import * as React from 'react';
import clsx from 'clsx';
import { useControlled } from '@base-ui-components/react/utils';
import classes from './ToggleButtonGroup.module.css';

export interface ToggleButtonGroupProps<Option extends { value: string; label: string }>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (newSelectedOption: Option) => void;
}

// TODO: replace with Base UI's RadioGroup or ToggleButtonGroup when available

export const ToggleButtonGroup = React.forwardRef(function ToggleButtonGroup<
  Option extends { value: string; label: string },
>(props: ToggleButtonGroupProps<Option>, ref: React.ForwardedRef<HTMLDivElement>) {
  const { options, value: valueProp, defaultValue, onValueChange, className, ...other } = props;
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'ToggleButtonGroup',
    state: 'value',
  });

  return (
    <div ref={ref} {...other} className={clsx(className, classes.root)} role="group">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          value={option.value}
          data-selected={value === option.value || undefined}
          aria-pressed={value === option.value || undefined}
          onClick={() => {
            setValue(option.value);
            onValueChange?.(option);
          }}
          className={classes.button}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}) as <Option extends { value: string; label: string }>(
  props: ToggleButtonGroupProps<Option> & { ref?: React.Ref<HTMLDivElement> },
) => React.JSX.Element;
