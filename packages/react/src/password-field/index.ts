export * as PasswordFieldPreview from './index.parts';

export type * from './root/PasswordFieldRoot';
export type * from './group/PasswordFieldGroup';
export type * from './input/PasswordFieldInput';
export type * from './toggle/PasswordFieldToggle';
export type * from './toggle-indicator/PasswordFieldToggleIndicator';

// The docs generator matches these to the `PasswordFieldPreview` parts by name.
// Drop `Preview` from them together with the namespace.
export * as PasswordFieldPreviewGroupDataAttributes from './group/PasswordFieldGroupDataAttributes';
export * as PasswordFieldPreviewInputDataAttributes from './input/PasswordFieldInputDataAttributes';
export * as PasswordFieldPreviewToggleDataAttributes from './toggle/PasswordFieldToggleDataAttributes';
export * as PasswordFieldPreviewToggleIndicatorDataAttributes from './toggle-indicator/PasswordFieldToggleIndicatorDataAttributes';
