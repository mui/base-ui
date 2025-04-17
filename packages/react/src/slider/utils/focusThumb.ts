import { activeElement } from '@floating-ui/react/utils';
import { ownerDocument } from '../../utils/owner';
import { SliderThumbDataAttributes } from '../thumb/SliderThumbDataAttributes';

export function focusThumb(
  thumbIndex: number,
  sliderRef: React.RefObject<HTMLElement | null>,
  setActive?: React.Dispatch<React.SetStateAction<number>>,
) {
  if (!sliderRef.current) {
    return;
  }

  const activeEl = activeElement(ownerDocument(sliderRef.current));

  if (
    activeEl == null ||
    !sliderRef.current.contains(activeEl) ||
    Number(activeEl.getAttribute(SliderThumbDataAttributes.index)) !== thumbIndex
  ) {
    // TODO: possibly simplify with thumbRefs as it already exists
    (
      sliderRef.current.querySelector(
        `[type="range"][${SliderThumbDataAttributes.index}="${thumbIndex}"]`,
      ) as HTMLInputElement
    ).focus();
  }

  if (setActive) {
    setActive(thumbIndex);
  }
}
