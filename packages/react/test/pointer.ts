import { fireEvent } from '@mui/internal-test-utils';

export function enterWithMouse(element: HTMLElement, init?: MouseEventInit) {
  fireEvent.pointerEnter(element, { pointerType: 'mouse', ...init });
  fireEvent.mouseEnter(element, init);
  fireEvent.mouseMove(element, init);
}

export function moveMouse(from: HTMLElement, to: HTMLElement) {
  fireEvent.pointerLeave(from, {
    pointerType: 'mouse',
    relatedTarget: to,
  });
  fireEvent.mouseLeave(from, { relatedTarget: to });
  fireEvent.pointerEnter(to, {
    pointerType: 'mouse',
    relatedTarget: from,
  });
  fireEvent.mouseEnter(to, { relatedTarget: from });
  fireEvent.mouseMove(to);
}
