import { FOCUSABLE_ATTRIBUTE } from '../../floating-ui-react/utils/constants';
import type { HTMLProps } from '../../internals/types';

export const FOCUSABLE_POPUP_PROPS = {
  tabIndex: -1,
  [FOCUSABLE_ATTRIBUTE]: '',
} as HTMLProps<HTMLElement> & Record<typeof FOCUSABLE_ATTRIBUTE, string>;
