export interface UsePopoverCloseParameters {
  onClose: () => void;
}

export interface UsePopoverCloseReturnValue {
  getCloseProps: (
    externalProps?: React.ComponentPropsWithoutRef<'button'>,
  ) => React.ComponentPropsWithoutRef<'button'>;
}
