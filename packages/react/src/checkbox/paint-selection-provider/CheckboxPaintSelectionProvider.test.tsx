import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { reset as resetWarnings } from '@base-ui/utils/warn';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { firePointer, isJSDOM } from '#test-utils';

const names = ['a', 'b', 'c', 'd'];
function Checkboxes({
  disabled,
  readOnly,
  cancel,
}: {
  disabled?: string;
  readOnly?: string;
  cancel?: string;
}) {
  return names.map((name) => (
    <Checkbox.Root
      key={name}
      value={name}
      aria-label={name}
      disabled={disabled === name}
      readOnly={readOnly === name}
      onCheckedChange={(_, details) => {
        if (cancel === name) {
          details.cancel();
        }
      }}
      style={{ display: 'block', width: 24, height: 24, marginBottom: 8 }}
    />
  ));
}
function position(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return { clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 };
}
function down(element: HTMLElement, pointerType = 'mouse') {
  firePointer.down(element, {
    ...position(element),
    pointerType,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    timeStamp: 100,
  });
}
function move(element: HTMLElement) {
  firePointer.move(element, {
    ...position(element),
    pointerType: 'mouse',
    pointerId: 1,
    isPrimary: true,
    buttons: 1,
    timeStamp: 120,
  });
}
function up(element: HTMLElement) {
  firePointer.up(element, {
    ...position(element),
    pointerType: 'mouse',
    pointerId: 1,
    isPrimary: true,
    button: 0,
    timeStamp: 140,
  });
}

describe.skipIf(isJSDOM)('<Checkbox.PaintSelectionProvider />', () => {
  const { render } = createRenderer();

  it('does not paint while disabled', async () => {
    await render(
      <Checkbox.PaintSelectionProvider disabled>
        <CheckboxGroup>
          <Checkboxes />
        </CheckboxGroup>
      </Checkbox.PaintSelectionProvider>,
    );
    const [a, b, c] = screen.getAllByRole('checkbox');
    down(a);
    move(c);
    up(c);
    fireEvent.click(c, { detail: 1 });
    expect(a).toHaveAttribute('aria-checked', 'false');
    expect(b).toHaveAttribute('aria-checked', 'false');
    expect(c).toHaveAttribute('aria-checked', 'true');
  });

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    'shrinks and extends the painted range, controlled=%s, clearing=%s',
    async (controlled, clearing) => {
      const initialValue = clearing ? ['a', 'c', 'd'] : ['b', 'd'];
      function App() {
        const [value, setValue] = React.useState(initialValue);
        return (
          <Checkbox.PaintSelectionProvider>
            <CheckboxGroup
              value={controlled ? value : undefined}
              defaultValue={initialValue}
              onValueChange={setValue}
            >
              <Checkboxes />
            </CheckboxGroup>
          </Checkbox.PaintSelectionProvider>
        );
      }
      await render(<App />);
      const [a, b, c, d] = screen.getAllByRole('checkbox');
      down(a);
      move(c);
      for (const item of [a, b, c]) {
        expect(item).toHaveAttribute('aria-checked', String(!clearing));
      }
      move(b);
      expect(a).toHaveAttribute('aria-checked', String(!clearing));
      expect(b).toHaveAttribute('aria-checked', String(!clearing));
      expect(c).toHaveAttribute('aria-checked', String(clearing));
      move(a);
      expect(b).toHaveAttribute('aria-checked', String(!clearing));
      expect(c).toHaveAttribute('aria-checked', String(clearing));
      move(c);
      for (const item of [a, b, c]) {
        expect(item).toHaveAttribute('aria-checked', String(!clearing));
      }
      up(c);
      fireEvent.click(c, { detail: 1 });
      expect(c).toHaveAttribute('aria-checked', String(!clearing));
      expect(d).toHaveAttribute('aria-checked', 'true');
    },
  );

  it.each([false, true])(
    'does not duplicate a checked indeterminate value, parent=%s',
    async (withParent) => {
      const onValueChange = vi.fn();
      await render(
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup
            defaultValue={['b']}
            allValues={withParent ? ['a', 'b'] : undefined}
            onValueChange={onValueChange}
          >
            <Checkbox.Root value="a" style={{ display: 'block', width: 24, height: 24 }} />
            <Checkbox.Root
              value="b"
              indeterminate
              style={{ display: 'block', width: 24, height: 24 }}
            />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>,
      );
      const [a, b] = screen.getAllByRole('checkbox');
      down(a);
      move(b);
      expect(onValueChange.mock.lastCall?.[0]).toEqual(['b', 'a']);
      move(a);
      up(a);
      expect(onValueChange.mock.lastCall?.[0]).toEqual(['b', 'a']);
    },
  );

  it.each([false, true])(
    'reverses past the starting checkbox in one sample, controlled=%s',
    async (controlled) => {
      function App() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <Checkbox.PaintSelectionProvider>
            <CheckboxGroup value={controlled ? value : undefined} onValueChange={setValue}>
              <Checkboxes />
            </CheckboxGroup>
          </Checkbox.PaintSelectionProvider>
        );
      }
      await render(<App />);
      const [a, b, c, d] = screen.getAllByRole('checkbox');
      down(b);
      move(d);
      move(a);
      up(a);
      expect(a).toHaveAttribute('aria-checked', 'true');
      expect(b).toHaveAttribute('aria-checked', 'true');
      expect(c).toHaveAttribute('aria-checked', 'false');
      expect(d).toHaveAttribute('aria-checked', 'false');
    },
  );

  it('registers a replacement rendered element', async () => {
    function App({ replace = false }) {
      return (
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <Checkbox.Root
              value="a"
              render={replace ? <div /> : <span />}
              style={{ display: 'block', width: 24, height: 24 }}
            />
            <Checkbox.Root
              value="b"
              render={replace ? <div /> : <span />}
              style={{ display: 'block', width: 24, height: 24 }}
            />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
      );
    }
    const { setProps } = await render(<App />);
    const [a, b] = screen.getAllByRole('checkbox');
    down(a);
    move(b);
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(b).toHaveAttribute('aria-checked', 'true');
    await setProps({ replace: true });
    const [newA, newB] = screen.getAllByRole('checkbox');
    move(newA);
    up(newA);
    expect(newA).toHaveAttribute('aria-checked', 'true');
    expect(newB).toHaveAttribute('aria-checked', 'false');
  });

  it.each([false, true])(
    'restores the earlier value of a checkbox whose value changed mid-gesture, clearing=%s',
    async (clearing) => {
      const onValueChange = vi.fn();
      function App({ second }: { second: string }) {
        return (
          <Checkbox.PaintSelectionProvider>
            <CheckboxGroup
              defaultValue={clearing ? ['a', 'b'] : ['b']}
              onValueChange={onValueChange}
            >
              <Checkbox.Root value="a" style={{ display: 'block', width: 24, height: 24 }} />
              <Checkbox.Root value={second} style={{ display: 'block', width: 24, height: 24 }} />
            </CheckboxGroup>
          </Checkbox.PaintSelectionProvider>
        );
      }
      const { setProps } = await render(<App second="b" />);
      const [a, second] = screen.getAllByRole('checkbox');
      down(a);
      move(second);
      await setProps({ second: 'd' });
      move(a);
      up(a);

      expect(a).toHaveAttribute('aria-checked', String(!clearing));
      expect(second).toHaveAttribute('aria-checked', 'false');
      expect(onValueChange.mock.lastCall?.[0]).toEqual(clearing ? ['b'] : ['b', 'a']);
    },
  );

  it('paints the visible part of a clipped checkbox and skips fully clipped items', async () => {
    await render(
      <React.Fragment>
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <div style={{ height: 42, overflow: 'hidden' }}>
              <Checkboxes />
            </div>
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
        <div data-testid="destination" style={{ width: 24, height: 150 }} />
      </React.Fragment>,
    );
    const [a, b, c, d] = screen.getAllByRole('checkbox');
    down(a);
    move(screen.getByTestId('destination'));
    up(a);
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(b).toHaveAttribute('aria-checked', 'true');
    expect(c).toHaveAttribute('aria-checked', 'false');
    expect(d).toHaveAttribute('aria-checked', 'false');
  });

  it('does not hit-test a portal in another document using local pointer coordinates', async () => {
    function App() {
      const [frame, setFrame] = React.useState<HTMLIFrameElement | null>(null);
      return (
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <Checkboxes />
            <iframe
              title="other document"
              ref={setFrame}
              style={{ position: 'absolute', left: 400, top: 0 }}
            />
            {frame?.contentDocument &&
              ReactDOM.createPortal(
                <Checkbox.Root
                  aria-label="portal"
                  value="portal"
                  style={{ display: 'block', width: 24, height: 24, marginTop: 32 }}
                />,
                frame.contentDocument.body,
              )}
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
      );
    }
    await render(<App />);
    const [a, , c] = screen.getAllByRole('checkbox');
    const frame = screen.getByTitle('other document') as HTMLIFrameElement;
    down(a);
    move(c);
    up(c);
    expect(frame.contentDocument!.querySelector('[role="checkbox"]')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(c).toHaveAttribute('aria-checked', 'true');
  });

  it('skips disabled, read-only, and canceled checkboxes', async () => {
    await render(
      <Checkbox.PaintSelectionProvider>
        <CheckboxGroup>
          <Checkboxes disabled="b" readOnly="c" cancel="d" />
        </CheckboxGroup>
      </Checkbox.PaintSelectionProvider>,
    );
    const [a, b, c, d] = screen.getAllByRole('checkbox');
    down(a);
    move(d);
    up(d);
    expect(a).toHaveAttribute('aria-checked', 'true');
    for (const item of [b, c, d]) {
      expect(item).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('isolates nested groups, sibling groups, and standalone checkboxes', async () => {
    await render(
      <React.Fragment>
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <Checkbox.Root
              aria-label="first"
              value="first"
              style={{ display: 'block', width: 24, height: 24 }}
            />
            <Checkbox.PaintSelectionProvider>
              <CheckboxGroup>
                <Checkboxes />
              </CheckboxGroup>
            </Checkbox.PaintSelectionProvider>
            <Checkbox.Root
              aria-label="last"
              value="last"
              style={{ display: 'block', width: 24, height: 24 }}
            />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <Checkboxes />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
        <Checkbox.Root aria-label="outside" style={{ display: 'block', width: 24, height: 24 }} />
      </React.Fragment>,
    );
    const first = screen.getByRole('checkbox', { name: 'first' });
    const last = screen.getByRole('checkbox', { name: 'last' });
    const outside = screen.getByRole('checkbox', { name: 'outside' });
    down(first);
    move(outside);
    up(outside);
    for (const item of screen.getAllByRole('checkbox')) {
      expect(item).toHaveAttribute(
        'aria-checked',
        item === first || item === last ? 'true' : 'false',
      );
    }
  });

  it('keeps click and keyboard activation and ignores touch dragging', async () => {
    const { user } = await render(
      <Checkbox.PaintSelectionProvider>
        <CheckboxGroup>
          <Checkboxes />
        </CheckboxGroup>
      </Checkbox.PaintSelectionProvider>,
    );
    const [a, b, c] = screen.getAllByRole('checkbox');
    down(a);
    up(a);
    fireEvent.click(a, { detail: 1 });
    expect(a).toHaveAttribute('aria-checked', 'true');
    await user.click(b);
    await user.keyboard('[Space]');
    expect(b).toHaveAttribute('aria-checked', 'false');
    down(b, 'touch');
    move(c);
    up(c);
    expect(c).toHaveAttribute('aria-checked', 'false');
  });

  it.each(['pointercancel', 'blur', 'unmount'])('cleans up after %s', async (end) => {
    const onValueChange = vi.fn();
    const { unmount } = await render(
      <Checkbox.PaintSelectionProvider>
        <CheckboxGroup onValueChange={onValueChange}>
          <Checkboxes />
        </CheckboxGroup>
      </Checkbox.PaintSelectionProvider>,
    );
    const [a, b, c] = screen.getAllByRole('checkbox');
    down(a);
    move(b);
    onValueChange.mockClear();
    if (end === 'pointercancel') {
      fireEvent.pointerCancel(b, { pointerId: 1 });
    } else if (end === 'blur') {
      fireEvent(window, new Event('blur'));
    } else {
      unmount();
    }
    move(c);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('accumulates parent-group children and leaves the parent checkbox out of painting', async () => {
    await render(
      <Checkbox.PaintSelectionProvider>
        <CheckboxGroup allValues={names}>
          <Checkbox.Root
            parent
            aria-label="all"
            style={{ display: 'block', width: 24, height: 24 }}
          />
          <Checkboxes />
        </CheckboxGroup>
      </Checkbox.PaintSelectionProvider>,
    );
    const [parent, a, b, c, d] = screen.getAllByRole('checkbox');
    down(a);
    move(d);
    up(d);
    for (const item of [parent, a, b, c, d]) {
      expect(item).toHaveAttribute('aria-checked', 'true');
    }
    down(parent);
    move(d);
    up(d);
    for (const item of [parent, a, b, c, d]) {
      expect(item).toHaveAttribute('aria-checked', 'true');
    }
  });

  it('proposes the whole trail to a controlled owner that applies it later', async () => {
    let proposal: string[] = [];
    function App() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <React.Fragment>
          <button type="button" onClick={() => setValue(proposal)}>
            Apply
          </button>
          <Checkbox.PaintSelectionProvider>
            <CheckboxGroup
              value={value}
              onValueChange={(next) => {
                proposal = next;
              }}
            >
              <Checkboxes />
            </CheckboxGroup>
          </Checkbox.PaintSelectionProvider>
        </React.Fragment>
      );
    }
    await render(<App />);
    const [a, b, c, d] = screen.getAllByRole('checkbox');
    down(a);
    move(b);
    expect(proposal).toEqual(['a', 'b']);
    move(d);
    expect(proposal).toEqual(['a', 'b', 'c', 'd']);
    move(b);
    expect(proposal).toEqual(['a', 'b']);
    // The owner has not applied any of them yet.
    for (const item of [a, b, c, d]) {
      expect(item).toHaveAttribute('aria-checked', 'false');
    }
    up(b);
    fireEvent.click(b, { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(b).toHaveAttribute('aria-checked', 'true');
    expect(c).toHaveAttribute('aria-checked', 'false');
    expect(d).toHaveAttribute('aria-checked', 'false');
  });

  it('restores a painted checkbox that became the parent checkbox as the group member it was', async () => {
    function App({ parent = false }: { parent?: boolean }) {
      const [value, setValue] = React.useState(['a', 'b']);
      return (
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup value={value} onValueChange={setValue} allValues={['a', 'b', 'c']}>
            <Checkbox.Root
              value="a"
              aria-label="a"
              style={{ display: 'block', width: 24, height: 24, marginBottom: 8 }}
            />
            <Checkbox.Root
              value="b"
              parent={parent}
              aria-label="b"
              style={{ display: 'block', width: 24, height: 24, marginBottom: 8 }}
            />
            <Checkbox.Root
              value="c"
              aria-label="c"
              style={{ display: 'block', width: 24, height: 24, marginBottom: 8 }}
            />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>
      );
    }
    const { setProps } = await render(<App />);
    const a = screen.getByRole('checkbox', { name: 'a' });
    const b = screen.getByRole('checkbox', { name: 'b' });
    down(a);
    move(b);
    expect(a).toHaveAttribute('aria-checked', 'false');
    await setProps({ parent: true });
    move(a);
    up(a);

    // Only `b` returns to the group, rather than the parent toggling every member.
    expect(a).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('checkbox', { name: 'c' })).toHaveAttribute('aria-checked', 'false');
    expect(b).toHaveAttribute('aria-checked', 'mixed');
  });
});

describe('<Checkbox.PaintSelectionProvider /> placement', () => {
  const { render } = createRenderer();

  afterEach(() => {
    resetWarnings();
  });

  it('warns when rendered inside a checkbox group', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await render(
        <CheckboxGroup>
          <Checkbox.PaintSelectionProvider>
            <Checkboxes />
          </Checkbox.PaintSelectionProvider>
        </CheckboxGroup>,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '`Checkbox.PaintSelectionProvider` has no effect on checkboxes outside the checkbox group it wraps.',
        ),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn around a checkbox group', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await render(
        <Checkbox.PaintSelectionProvider>
          <CheckboxGroup>
            <Checkboxes />
          </CheckboxGroup>
        </Checkbox.PaintSelectionProvider>,
      );
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe('CheckboxGroup controlled activation', () => {
  const { render } = createRenderer();
  it.each([false, true])(
    'does not accumulate rejected clicks, parent group=%s',
    async (withParent) => {
      const onValueChange = vi.fn();
      await render(
        <CheckboxGroup
          value={[]}
          allValues={withParent ? names : undefined}
          onValueChange={onValueChange}
        >
          <Checkboxes />
        </CheckboxGroup>,
      );
      const [a, b] = screen.getAllByRole('checkbox');
      fireEvent.click(a);
      fireEvent.click(b);
      expect(onValueChange.mock.lastCall?.[0]).toEqual(['b']);
      fireEvent.click(b);
      expect(onValueChange.mock.lastCall?.[0]).toEqual(['b']);
    },
  );
});
