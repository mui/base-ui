import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen, act, fireEvent, reactMajor } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui/react/number-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { platform } from '@base-ui/utils/platform';

const isWebKit = platform.engine.webkit;

// TODO (@Janpot): Contribute https://github.com/testing-library/user-event/issues/903 and
// rely on `user.pointer()` instead.
let currentPos = { clientX: 0, clientY: 0 };

function createPointerDownEvent(elm: HTMLElement) {
  const box = elm.getBoundingClientRect();
  const centerX = box.left + box.width / 2;
  const centerY = box.top + box.height / 2;
  currentPos = { clientX: centerX, clientY: centerY };
  return new PointerEvent('pointerdown', {
    bubbles: true,
    ...currentPos,
  });
}

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  currentPos = {
    clientX: currentPos.clientX + movementX,
    clientY: currentPos.clientY + movementY,
  };
  return new PointerEvent('pointermove', {
    bubbles: true,
    ...currentPos,
    movementX,
    movementY,
  });
}

describe('<NumberField.ScrubArea />', () => {
  const { render } = createRenderer();

  function createClipboardData(text: string) {
    return {
      getData: (type: string) => (type === 'text/plain' ? text : ''),
    };
  }

  function pasteText(target: HTMLElement, value: string) {
    if (isJSDOM) {
      fireEvent.paste(target, {
        clipboardData: createClipboardData(value),
      });
      return;
    }

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: createClipboardData(value),
    });

    fireEvent(target, pasteEvent);
  }

  describeConformance(<NumberField.ScrubArea />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: async (node) => {
      return render(<NumberField.Root>{node}</NumberField.Root>);
    },
  }));

  it('has presentation role', async () => {
    await render(
      <NumberField.Root>
        <NumberField.ScrubArea />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('presentation')).not.toBe(null);
  });

  describe('touch input', () => {
    function createTouch(target: EventTarget) {
      if (typeof Touch === 'function') {
        return new Touch({ identifier: 1, target, clientX: 0, clientY: 0 });
      }
      return { clientX: 0, clientY: 0 };
    }

    async function renderScrubArea() {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" />
        </NumberField.Root>,
      );
      return { scrubArea: screen.getByTestId('scrub-area') };
    }

    it('blocks scrolling for a single-touch scrub', async () => {
      const { scrubArea } = await renderScrubArea();
      const notCanceled = fireEvent.touchStart(scrubArea, {
        touches: [createTouch(scrubArea)],
      });
      expect(notCanceled).toBe(false);
    });

    it('leaves multi-touch gestures such as pinch-zoom to the browser', async () => {
      const { scrubArea } = await renderScrubArea();
      const notCanceled = fireEvent.touchStart(scrubArea, {
        touches: [createTouch(scrubArea), createTouch(scrubArea)],
      });
      expect(notCanceled).toBe(true);
    });
  });

  describe('pointerdown guards', () => {
    async function renderScrubArea(props?: NumberField.Root.Props) {
      await render(
        <NumberField.Root defaultValue={0} data-testid="root" {...props}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );
      return {
        scrubArea: screen.getByTestId('scrub-area'),
        root: screen.getByTestId('root'),
      };
    }

    it('ignores non-primary pointer buttons', async () => {
      const { scrubArea, root } = await renderScrubArea();

      await act(async () => {
        scrubArea.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 1 }));
      });

      expect(root).not.toHaveAttribute('data-scrubbing');
    });

    it('does not start scrubbing when the field is read-only', async () => {
      const { scrubArea, root } = await renderScrubArea({ readOnly: true });

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      });

      expect(root).not.toHaveAttribute('data-scrubbing');
    });
  });

  // Only run the following tests in Chromium/Firefox.
  if (isJSDOM || isWebKit) {
    return;
  }

  it('should increment or decrement the value when scrubbing with the pointer', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');
    const input = screen.getByRole('textbox');

    await act(async () => {
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -10 }));
    });

    expect(input).toHaveValue('-10');
    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
    });

    expect(input).toHaveValue('-5');

    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));
    });

    expect(input).toHaveValue('-7');
  });

  it('tracks visual viewport scale and removes scrub listeners after pointer lock exits', async () => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      throw new Error('Expected visualViewport in a browser test.');
    }

    let scale = 2;
    const scaleGetter = vi.spyOn(visualViewport, 'scale', 'get').mockImplementation(() => scale);
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    try {
      await render(
        <NumberField.Root defaultValue={0} data-testid="root">
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area">
            <NumberField.ScrubAreaCursor data-testid="cursor" />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const root = screen.getByTestId('root');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      });

      const cursor = screen.getByTestId('cursor');
      expect(cursor.style.transform).toContain('scale(0.5)');

      scale = 4;
      await act(async () => {
        window.dispatchEvent(createPointerMoveEvent({ movementX: 4 }));
      });
      expect(cursor.style.transform).toContain('scale(0.25)');

      const pointerUpListener = addEventListener.mock.calls.find(([type]) => type === 'pointerup');
      const pointerMoveListener = addEventListener.mock.calls.find(
        ([type]) => type === 'pointermove',
      );
      expect(pointerUpListener).toBeDefined();
      expect(pointerMoveListener).toBeDefined();

      await act(async () => {
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      });

      expect(root).not.toHaveAttribute('data-scrubbing');
      expect(screen.queryByTestId('cursor')).toBe(null);
      expect(removeEventListener).toHaveBeenCalledWith('pointerup', pointerUpListener?.[1], true);
      expect(removeEventListener).toHaveBeenCalledWith(
        'pointermove',
        pointerMoveListener?.[1],
        true,
      );
    } finally {
      scaleGetter.mockRestore();
      addEventListener.mockRestore();
      removeEventListener.mockRestore();
    }
  });

  it('clears the root scrubbing state when the scrub area unmounts mid-scrub', async () => {
    function App(props: { scrubAreaMounted: boolean }) {
      return (
        <NumberField.Root defaultValue={0} data-testid="root">
          <NumberField.Input />
          {props.scrubAreaMounted && (
            <NumberField.ScrubArea data-testid="scrub-area">
              <NumberField.ScrubAreaCursor />
            </NumberField.ScrubArea>
          )}
        </NumberField.Root>
      );
    }

    const { setProps } = await render(<App scrubAreaMounted />);

    const scrubArea = screen.getByTestId('scrub-area');
    const root = screen.getByTestId('root');

    await act(async () => {
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -10 }));
    });

    expect(root).toHaveAttribute('data-scrubbing');

    // Unmount the scrub area before pointerup; the root must not stay stuck in the scrubbing state.
    await act(async () => {
      setProps({ scrubAreaMounted: false });
    });

    expect(root).not.toHaveAttribute('data-scrubbing');
  });

  it('syncs the visible input value when scrubbing after pasting', async () => {
    const onValueChange = vi.fn();

    await render(
      <NumberField.Root defaultValue={10} onValueChange={onValueChange}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Select the existing value so the paste replaces it rather than inserting at the caret.
    await act(async () => input.focus());
    input.select();
    pasteText(input, '20');

    expect(input).toHaveValue('20');
    expect(onValueChange.mock.lastCall?.[0]).toBe(20);

    await act(async () => {
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 2 }));
    });

    expect(onValueChange.mock.lastCall?.[0]).toBe(22);
    expect(input).toHaveValue('22');
  });

  it('calls onValueChange while scrubbing and onValueCommitted on pointerup', async () => {
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();

    await render(
      <NumberField.Root
        defaultValue={0}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');

    await act(async () => {
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 3 }));
    });

    // One or more changes depending on pixel sensitivity and environment
    expect(onValueChange.mock.calls.length).toBeGreaterThan(0);

    await act(async () => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    expect(onValueCommitted.mock.calls.length).toBe(1);

    const lastChange = onValueChange.mock.lastCall?.[0];
    const committed = onValueCommitted.mock.calls[0][0];
    expect(committed).toBe(lastChange);
  });

  // Gecko defers the pointer lock release by 20ms, so the scrub is still live right after
  // `pointerup` there; that path is covered by `NumberFieldScrubArea.gecko.test.tsx`.
  it.skipIf(platform.engine.gecko)(
    'ignores pointer movement once the scrub has ended',
    async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).toHaveValue('10');

      await act(async () => {
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        window.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).toHaveValue('10');
    },
  );

  describe.skipIf(reactMajor < 19)('React.Activity', () => {
    it('does not resume scrubbing when a hidden scrub area is revealed again', async () => {
      const Activity = (
        React as typeof React & {
          Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>;
        }
      ).Activity;

      function App(props: { visible: boolean }) {
        return (
          <Activity mode={props.visible ? 'visible' : 'hidden'}>
            <NumberField.Root defaultValue={0}>
              <NumberField.Input />
              <NumberField.ScrubArea data-testid="scrub-area">
                <NumberField.ScrubAreaCursor />
              </NumberField.ScrubArea>
            </NumberField.Root>
          </Activity>
        );
      }

      const { setProps } = await render(<App visible />);

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).toHaveValue('10');

      // Hiding tears the effects down mid-scrub without unmounting; revealing re-runs them.
      await act(async () => setProps({ visible: false }));
      await act(async () => setProps({ visible: true }));

      // No pointer is down anymore, so a bare mouse move must not change the value.
      await act(async () => {
        window.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(screen.getByRole('textbox')).toHaveValue('10');
    });
  });

  describe('prop: pixelSensitivity', () => {
    it('does not change the value for a zero-distance move when sensitivity is 0', async () => {
      const onValueChange = vi.fn();

      await render(
        // `snapOnStep` makes a zero-amount step observable: it would snap 3.5 down to 3.
        <NumberField.Root defaultValue={3.5} step={1} snapOnStep onValueChange={onValueChange}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={0}>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 0 }));
      });

      expect(screen.getByRole('textbox')).toHaveValue('3.5');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('should only increment if the pointer movement was greater than or equal to the value', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={5}>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));
      });

      expect(input).toHaveValue('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 2 }));
      });

      expect(input).toHaveValue('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      });

      expect(input).toHaveValue('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      });

      expect(input).toHaveValue('1');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
      });

      expect(input).toHaveValue('6');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -4 }));
      });

      expect(input).toHaveValue('6');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -1 }));
      });

      expect(input).toHaveValue('5');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
      });

      expect(input).toHaveValue('10');
    });
  });

  describe('prop: teleportDistance', () => {
    it('wraps the virtual cursor around the allowed bounds', async () => {
      // Headless Chromium denies pointer lock, which unmounts the virtual cursor mid-test.
      const pointerLock = vi
        .spyOn(document.body, 'requestPointerLock')
        .mockImplementation(() => Promise.resolve());

      try {
        await render(
          <NumberField.Root defaultValue={0}>
            <NumberField.Input />
            {/* Pin the scrub area so the bounds don't shift as the value (and input width) grows. */}
            <NumberField.ScrubArea
              data-testid="scrub-area"
              teleportDistance={100}
              style={{ position: 'fixed', left: 100, top: 100, width: 20, height: 20 }}
            >
              <NumberField.ScrubAreaCursor data-testid="cursor" />
            </NumberField.ScrubArea>
          </NumberField.Root>,
        );

        const scrubArea = screen.getByTestId('scrub-area');

        await act(async () => {
          scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        });

        const cursor = screen.getByTestId('cursor');
        // The bare cursor has no size, so its wrap coordinates are the bounds themselves.
        expect(cursor.offsetWidth).toBe(0);

        // Past the right bound (120 + 100 / 2): the cursor reappears at the left one.
        await act(async () => {
          scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5000 }));
        });
        expect(cursor.style.transform).toContain('translate3d(50px,');

        // And symmetrically past the left bound (100 - 100 / 2).
        await act(async () => {
          scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -5000 }));
        });
        expect(cursor.style.transform).toContain('translate3d(170px,');
      } finally {
        pointerLock.mockRestore();
      }
    });
  });

  describe('prop: direction', () => {
    it('scrubs on vertical movement when direction is vertical', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" direction="vertical">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).toHaveValue('0');

      // Upward movement (negative Y) increases the value.
      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -10 }));
      });

      expect(input).toHaveValue('10');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 4 }));
      });

      expect(input).toHaveValue('6');
    });

    it('should only scrub if the pointer moved in the given direction', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" direction="horizontal">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).toHaveValue('10');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));
      });

      expect(input).toHaveValue('10');
    });
  });

  it('should fire onClick when clicked without scrubbing', async () => {
    const handleClick = vi.fn();

    const { user } = await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea data-testid="scrub-area" onClick={handleClick}>
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    await user.click(screen.getByTestId('scrub-area'));

    expect(handleClick.mock.calls.length).toBe(1);
  });

  it('should fire onClick on child elements', async () => {
    const handleScrubAreaClick = vi.fn();
    const handleLabelClick = vi.fn();

    const { user } = await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea onClick={handleScrubAreaClick}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <label onClick={handleLabelClick}>Amount</label>
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    await user.click(screen.getByText('Amount'));

    expect(handleLabelClick.mock.calls.length).toBe(1);
    expect(handleScrubAreaClick.mock.calls.length).toBe(1);
  });
});
