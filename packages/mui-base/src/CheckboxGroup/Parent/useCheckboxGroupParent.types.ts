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
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  getChildProps: (name: string) => {
    name: string;
    id: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
}
