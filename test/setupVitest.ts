import { isJSDOM } from '@base-ui/utils/detectBrowser';
import setupVitest from '@mui/internal-test-utils/setupVitest';
import '@testing-library/jest-dom/vitest';

declare global {
  // eslint-disable-next-line vars-on-top
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

setupVitest({ failOnConsoleEnabed: false });

globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

if (isJSDOM) {
  globalThis.requestAnimationFrame = (cb) => {
    setTimeout(() => cb(0), 0);
    return 0;
  };
}
