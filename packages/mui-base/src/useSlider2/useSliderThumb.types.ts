export interface UseSliderThumbParameters {
  id?: string;
  disabled?: boolean;
  rootRef?: React.Ref<Element>;
}

export interface UseSliderThumbReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  getThumbInputProps: (
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  /**
   * Resolver for the thumb slot's style prop.
   * @param index of the currently moved thumb
   * @returns props that should be spread on the style prop of thumb slot
   */
  getThumbStyle: (index: number) => Record<string, unknown>;
  index: number;
}

export interface ThumbMetadata {
  inputId: string;
  ref: React.RefObject<HTMLElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}
