import { fireEvent } from '@mui/internal-test-utils';

/**
 * Dispatches a `paste` event carrying `value` as `text/plain`. `fireEvent.paste` can't be used
 * because Testing Library rebuilds `clipboardData` as an empty object in some environments.
 */
export function pasteText(target: HTMLElement, value: string) {
  const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(pasteEvent, 'clipboardData', {
    value: {
      getData: (type: string) => (type === 'text/plain' ? value : ''),
    },
  });

  fireEvent(target, pasteEvent);
}
