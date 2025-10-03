import { Checkbox } from '@base-ui-components/react/checkbox';

export type CheckboxProps = Omit<Checkbox.Root.Props, 'className'> & {
  className?: string;
};
