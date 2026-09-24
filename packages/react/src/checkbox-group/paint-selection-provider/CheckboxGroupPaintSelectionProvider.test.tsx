import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect, vi } from 'vitest';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup, CheckboxGroupPaintSelectionProvider } from '@base-ui/react/checkbox-group';
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

describe.skipIf(isJSDOM)('<CheckboxGroupPaintSelectionProvider />', () => {
  const { render } = createRenderer();

  it.each([false, true])(
    'paints skipped items and preserves its intent on backtracking, controlled=%s',
    async (controlled) => {
      function App() {
        const [value, setValue] = React.useState(['b']);
        return (
          <CheckboxGroup
            value={controlled ? value : undefined}
            defaultValue={['b']}
            onValueChange={setValue}
          >
            <CheckboxGroupPaintSelectionProvider>
              <Checkboxes />
            </CheckboxGroupPaintSelectionProvider>
          </CheckboxGroup>
        );
      }
      await render(<App />);
      const [a, b, c, d] = screen.getAllByRole('checkbox');
      down(a);
      move(c);
      move(a);
      up(a);
      fireEvent.click(a, { detail: 1 });
      for (const item of [a, b, c]) {
        expect(item).toHaveAttribute('aria-checked', 'true');
      }
      expect(d).toHaveAttribute('aria-checked', 'false');
      down(c);
      move(a);
      up(a);
      fireEvent.click(a, { detail: 1 });
      for (const item of [a, b, c, d]) {
        expect(item).toHaveAttribute('aria-checked', 'false');
      }
    },
  );

  it.each([false, true])(
    'does not duplicate a checked indeterminate value, parent=%s',
    async (withParent) => {
      const onValueChange = vi.fn();
      await render(
        <CheckboxGroup
          defaultValue={['a']}
          allValues={withParent ? ['a', 'b'] : undefined}
          onValueChange={onValueChange}
        >
          <CheckboxGroupPaintSelectionProvider>
            <Checkbox.Root
              value="a"
              indeterminate
              style={{ display: 'block', width: 24, height: 24 }}
            />
            <Checkbox.Root value="b" style={{ display: 'block', width: 24, height: 24 }} />
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>,
      );
      const [a, b] = screen.getAllByRole('checkbox');
      down(a);
      move(b);
      up(b);
      expect(onValueChange.mock.lastCall?.[0]).toEqual(['a', 'b']);
    },
  );

  it('registers a replacement rendered element', async () => {
    function App({ replace = false }) {
      return (
        <CheckboxGroup>
          <CheckboxGroupPaintSelectionProvider>
            <Checkbox.Root
              value="a"
              render={replace ? <div /> : <span />}
              style={{ display: 'block', width: 24, height: 24 }}
            />
            <Checkbox.Root value="b" style={{ display: 'block', width: 24, height: 24 }} />
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>
      );
    }
    const { setProps } = await render(<App />);
    await setProps({ replace: true });
    const [a, b] = screen.getAllByRole('checkbox');
    down(a);
    move(b);
    up(b);
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(b).toHaveAttribute('aria-checked', 'true');
  });

  it('paints the visible part of a clipped checkbox and skips fully clipped items', async () => {
    await render(
      <React.Fragment>
        <CheckboxGroup>
          <CheckboxGroupPaintSelectionProvider>
            <div style={{ height: 42, overflow: 'hidden' }}>
              <Checkboxes />
            </div>
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>
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
        <CheckboxGroup>
          <CheckboxGroupPaintSelectionProvider>
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
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>
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
      <CheckboxGroup>
        <CheckboxGroupPaintSelectionProvider>
          <Checkboxes disabled="b" readOnly="c" cancel="d" />
        </CheckboxGroupPaintSelectionProvider>
      </CheckboxGroup>,
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
        <CheckboxGroup>
          <CheckboxGroupPaintSelectionProvider>
            <Checkbox.Root
              aria-label="first"
              value="first"
              style={{ display: 'block', width: 24, height: 24 }}
            />
            <CheckboxGroup>
              <CheckboxGroupPaintSelectionProvider>
                <Checkboxes />
              </CheckboxGroupPaintSelectionProvider>
            </CheckboxGroup>
            <Checkbox.Root
              aria-label="last"
              value="last"
              style={{ display: 'block', width: 24, height: 24 }}
            />
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>
        <CheckboxGroup>
          <CheckboxGroupPaintSelectionProvider>
            <Checkboxes />
          </CheckboxGroupPaintSelectionProvider>
        </CheckboxGroup>
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
      <CheckboxGroup>
        <CheckboxGroupPaintSelectionProvider>
          <Checkboxes />
        </CheckboxGroupPaintSelectionProvider>
      </CheckboxGroup>,
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
      <CheckboxGroup onValueChange={onValueChange}>
        <CheckboxGroupPaintSelectionProvider>
          <Checkboxes />
        </CheckboxGroupPaintSelectionProvider>
      </CheckboxGroup>,
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
      <CheckboxGroup allValues={names}>
        <CheckboxGroupPaintSelectionProvider>
          <Checkbox.Root
            parent
            aria-label="all"
            style={{ display: 'block', width: 24, height: 24 }}
          />
          <Checkboxes />
        </CheckboxGroupPaintSelectionProvider>
      </CheckboxGroup>,
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

  it('respects a controlled owner refusing the proposed changes', async () => {
    const onValueChange = vi.fn();
    await render(
      <CheckboxGroup value={[]} onValueChange={onValueChange}>
        <CheckboxGroupPaintSelectionProvider>
          <Checkboxes />
        </CheckboxGroupPaintSelectionProvider>
      </CheckboxGroup>,
    );
    const [a, b, c] = screen.getAllByRole('checkbox');
    down(a);
    move(b);
    expect(onValueChange.mock.lastCall?.[0]).toEqual(['a', 'b']);
    move(c);
    expect(onValueChange.mock.lastCall?.[0]).toEqual(['c']);
    for (const item of [a, b, c]) {
      expect(item).toHaveAttribute('aria-checked', 'false');
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
