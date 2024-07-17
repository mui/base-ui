export { CollapsibleRoot as Root } from './Root/CollapsibleRoot';
export {
  CollapsibleRootOwnerState as CollapsibleOwnerState,
  CollapsibleRootProps as RootProps,
  UseCollapsibleRootParameters,
  UseCollapsibleRootReturnValue,
  CollapsibleContextValue,
} from './Root/CollapsibleRoot.types';
export { useCollapsibleRoot } from './Root/useCollapsibleRoot';
export * from './Root/CollapsibleContext';

export { CollapsibleTrigger as Trigger } from './Trigger/CollapsibleTrigger';
export type {
  CollapsibleTriggerProps as TriggerProps,
  UseCollapsibleTriggerParameters,
  UseCollapsibleTriggerReturnValue,
} from './Trigger/CollapsibleTrigger.types';
export { useCollapsibleTrigger } from './Trigger/useCollapsibleTrigger';

export { CollapsibleContent as Content } from './Content/CollapsibleContent';
export type {
  CollapsibleContentProps as ContentProps,
  UseCollapsibleContentParameters,
  UseCollapsibleContentReturnValue,
} from './Content/CollapsibleContent.types';
export { useCollapsibleContent } from './Content/useCollapsibleContent';
