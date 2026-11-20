export * from './index.parts';

export type {
  ToggleState,
  ToggleProps,
  ToggleChangeEventReason,
  ToggleChangeEventDetails,
} from './root/ToggleRoot';

export * as RootDataAttributes from './root/ToggleRootDataAttributes';
export * as IndicatorDataAttributes from './indicator/ToggleIndicatorDataAttributes';
/**
 * @deprecated Use `RootDataAttributes` instead.
 */
export * as ToggleDataAttributes from './root/ToggleRootDataAttributes';
