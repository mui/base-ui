import { type SelectRoot } from '../root/SelectRoot';

export function SelectItemTemplate(_props: SelectItemTemplate.Props): null {
  return null;
}

export namespace SelectItemTemplate {
  export interface Props {
    children: (item: SelectRoot.SelectOption<any>) => React.ReactNode;
  }
}
