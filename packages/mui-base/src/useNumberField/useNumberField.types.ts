import type { ScrubHandle } from './useScrub.types';

export interface UseNumberFieldReturnValue {
  getGroupProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  getInputProps: (
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  getIncrementButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  getDecrementButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  getScrubAreaProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  getScrubAreaCursorProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  inputValue: string;
  value: number | null;
  isScrubbing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  scrubHandleRef: React.RefObject<ScrubHandle | null>;
  scrubAreaRef: React.RefObject<HTMLSpanElement>;
  scrubAreaCursorRef: React.RefObject<HTMLSpanElement>;
}
