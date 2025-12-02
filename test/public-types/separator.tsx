import { Separator } from '@base-ui-components/react/separator';

export type SeparatorProps = Omit<Separator.Props, 'children'> & {
  // Add an optional className to mirror original example's augmentation pattern.
  className?: string;
};
