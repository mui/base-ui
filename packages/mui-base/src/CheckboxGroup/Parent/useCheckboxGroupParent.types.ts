export interface UseCheckboxGroupParentParameters {
  allValues?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export interface UseCheckboxGroupParentReturnValue {
  id: string | undefined;
  indeterminate: boolean;
  getParentProps: () => {
    id: string | undefined;
    indeterminate: boolean;
    checked: boolean;
    'aria-controls': string;
    onCheckedChange: (checked: boolean) => void;
  };
  getChildProps: (name: string) => {
    name: string;
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  };
}
