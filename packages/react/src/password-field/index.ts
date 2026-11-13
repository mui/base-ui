export * as PasswordFieldPreview from './index.parts';

export type * from './root/PasswordFieldRoot';
export type * from './input/PasswordFieldInput';
export type * from './toggle/PasswordFieldToggle';

// The docs generator matches these to the `PasswordFieldPreview` parts by name.
// Drop `Preview` from them together with the namespace.
export * as PasswordFieldPreviewRootDataAttributes from './root/PasswordFieldRootDataAttributes';
export * as PasswordFieldPreviewInputDataAttributes from '../input/InputDataAttributes';
export * as PasswordFieldPreviewToggleDataAttributes from './toggle/PasswordFieldToggleDataAttributes';
