import { onTestFinished } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui/utils/testUtils';
import { wait, waitSingleFrame } from './wait';

const ENDING_STYLE_ATTRIBUTE = 'data-ending-style';
const ANIMATION_NAME = 'base-ui-test-held-exit';

export interface ExitHold {
  /**
   * Finishes the exits in progress and waits for React to commit what they were holding back,
   * such as the unmount. Exits that start later are held again.
   */
  release(): Promise<void>;
}

export interface HoldExitOptions {
  /**
   * How exits are held:
   * - `'animation'`: a real CSS animation on every `[data-ending-style]` element. Browsers only.
   *   Like any exit animation, it's canceled when the element leaves its ending state.
   * - `'manual'`: `getAnimations()` reports a pending animation for every `[data-ending-style]`
   *   element. Works in jsdom and browsers.
   * @default 'animation' in browsers, 'manual' in jsdom
   */
  adapter?: 'animation' | 'manual';
}

/**
 * Holds every exit animation until the test releases it, so a test can observe a popup between
 * its close and its unmount. Call it inside a test or a `beforeEach`; it's undone when the test
 * finishes.
 */
export function holdExit(options: HoldExitOptions = {}): ExitHold {
  const { adapter: adapterName = isJSDOM ? 'manual' : 'animation' } = options;

  const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
  globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

  const adapter = adapterName === 'animation' ? holdWithCssAnimation() : holdManually();

  onTestFinished(() => {
    adapter.dispose();
    globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
  });

  return {
    async release() {
      await act(async () => {
        adapter.finish();
        // An exit checks its animations a frame after it starts, and settles in promise
        // callbacks before it commits.
        await waitSingleFrame();
        await wait(0);
      });
    },
  };
}

interface HoldAdapter {
  finish(): void;
  dispose(): void;
}

function holdManually(): HoldAdapter {
  // One pending animation per element in its ending state, the way a CSS exit animation starts.
  const held = new Map<Element, HeldAnimation>();
  // Released elements end their current exit without a hold. A later exit is held again.
  const released = new WeakSet<Element>();
  const observer = new MutationObserver((records) => {
    records.forEach(({ target }) => {
      if (!(target as Element).hasAttribute(ENDING_STYLE_ATTRIBUTE)) {
        released.delete(target as Element);
        held.delete(target as Element);
      }
    });
  });
  observer.observe(document, {
    attributeFilter: [ENDING_STYLE_ATTRIBUTE],
    subtree: true,
  });

  const prototype = Element.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'getAnimations');
  const getAnimations: Element['getAnimations'] | undefined = descriptor?.value;

  Object.defineProperty(prototype, 'getAnimations', {
    configurable: true,
    writable: true,
    value(this: Element, getAnimationsOptions?: GetAnimationsOptions) {
      const animations = getAnimations?.call(this, getAnimationsOptions) ?? [];
      if (!this.hasAttribute(ENDING_STYLE_ATTRIBUTE) || released.has(this)) {
        return animations;
      }
      let animation = held.get(this);
      if (!animation) {
        animation = createHeldAnimation();
        held.set(this, animation);
      }
      return [...animations, animation.animation];
    },
  });

  return {
    finish() {
      document.querySelectorAll(`[${ENDING_STYLE_ATTRIBUTE}]`).forEach((element) => {
        released.add(element);
      });
      held.forEach((animation) => animation.finish());
      held.clear();
    },
    dispose() {
      observer.disconnect();
      if (descriptor) {
        Object.defineProperty(prototype, 'getAnimations', descriptor);
      } else {
        delete (prototype as Partial<Element>).getAnimations;
      }
    },
  };
}

interface HeldAnimation {
  animation: Animation;
  finish(): void;
}

function createHeldAnimation(): HeldAnimation {
  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });
  const animation = {
    finished,
    pending: false,
    playState: 'running',
    effect: { getTiming: () => ({ duration: 1, iterations: 1 }) },
  };

  return {
    animation: animation as unknown as Animation,
    finish() {
      animation.playState = 'finished';
      resolveFinished();
    },
  };
}

function holdWithCssAnimation(): HoldAdapter {
  // Longer than any test runs, so only `release()` ends it.
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ${ANIMATION_NAME} { to { opacity: 0; } }
    [${ENDING_STYLE_ATTRIBUTE}] { animation: ${ANIMATION_NAME} 1000s linear; }
  `;
  document.head.appendChild(style);

  return {
    finish() {
      document.getAnimations().forEach((animation) => {
        if ((animation as CSSAnimation).animationName === ANIMATION_NAME) {
          animation.finish();
        }
      });
    },
    dispose() {
      style.remove();
    },
  };
}
