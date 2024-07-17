export { CollapsibleRoot } from './Root/CollapsibleRoot';
export type * from './Root/CollapsibleRoot.types';
export { useCollapsibleRoot } from './Root/useCollapsibleRoot';
export * from './Root/CollapsibleContext';

export { CollapsibleTrigger } from './Trigger/CollapsibleTrigger';
export type {
  CollapsibleTriggerProps as TriggerProps,
  UseCollapsibleTriggerParameters,
  UseCollapsibleTriggerReturnValue,
} from './Trigger/CollapsibleTrigger.types';
export { useCollapsibleTrigger } from './Trigger/useCollapsibleTrigger';

export { CollapsibleContent } from './Content/CollapsibleContent';
export type {
  CollapsibleContentProps as ContentProps,
  UseCollapsibleContentParameters,
  UseCollapsibleContentReturnValue,
} from './Content/CollapsibleContent.types';
export { useCollapsibleContent } from './Content/useCollapsibleContent';
