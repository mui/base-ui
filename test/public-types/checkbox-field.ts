// ./checkbox-field
import { Checkbox } from '@base-ui-components/react/checkbox';

export type CheckboxFieldProps = Omit<Checkbox.Root.Props, 'className'> & {
  className?: string;
};
