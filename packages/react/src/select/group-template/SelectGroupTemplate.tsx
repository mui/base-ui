import { HTMLProps } from '@base-ui-components/react/utils/types';
import { type SelectRoot } from '../root/SelectRoot';

export function SelectGroupTemplate(_props: SelectGroupTemplate.Props): null {
  return null;
}

export namespace SelectGroupTemplate {
  export interface Props {
    children: (
      item: SelectRoot.SelectGroup<any>,
      props: HTMLProps,
      childItems: React.ReactNode[],
    ) => React.ReactNode;
  }
}
