import { SelectOption } from '../useOption';

const defaultOptionStringifier = <OptionValue>(option: SelectOption<OptionValue>) => {
  const { valueAsString, value } = option;
  if (typeof valueAsString === 'string') {
    return valueAsString;
  }

  if (typeof value === 'string') {
    return value;
  }

  // Fallback string representation
  return String(option);
};

export { defaultOptionStringifier };
