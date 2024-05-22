import { NumberFieldRootOwnerState } from '../Root/NumberFieldRoot.types';
import { BaseUIComponentProps } from '../../utils/BaseUI.types';

export interface NumberFieldScrubAreaProps
  extends BaseUIComponentProps<'span', NumberFieldRootOwnerState> {
  /**
   * The direction that the scrub area should change the value.
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Determines the number of pixels the cursor must move before the value changes. A higher value
   * will make the scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity?: number;
  /**
   * If specified, how much the cursor can move around the center of the scrub area element before
   * it will loop back around.
   */
  teleportDistance?: number | undefined;
}
