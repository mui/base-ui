import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Checkbox } from '@base-ui/react/checkbox';
import { createRenderer } from '#test-utils';

describe('useAriaLabelledBy', () => {
  const { render } = createRenderer();

  it('uses a wrapping label that is not the direct parent', async () => {
    await render(
      <label>
        <span>
          <Checkbox.Root />
        </span>
        Label
      </label>,
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Label').id,
    );
  });

  it('uses the first associated label in tree order', async () => {
    await render(
      <div>
        <label htmlFor="control">First</label>
        <label>
          <Checkbox.Root id="control" />
          Second
        </label>
        <label htmlFor="control">Third</label>
      </div>,
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('First').id,
    );
  });

  it('ignores a wrapping label that labels another control', async () => {
    await render(
      <div>
        <input id="other" />
        <label htmlFor="other">
          <Checkbox.Root />
          Label
        </label>
      </div>,
    );

    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-labelledby');
  });

  it('resolves each control when many mount together', async () => {
    const ids = ['a', 'b', 'c'];

    await render(
      <div>
        {ids.map((id) => (
          <React.Fragment key={id}>
            <label htmlFor={id}>Label {id}</label>
            <Checkbox.Root id={id} />
          </React.Fragment>
        ))}
      </div>,
    );

    screen.getAllByRole('checkbox').forEach((checkbox, index) => {
      expect(checkbox).toHaveAttribute(
        'aria-labelledby',
        screen.getByText(`Label ${ids[index]}`).id,
      );
    });
  });

  it('picks up a label mounted by a synchronous re-render', async () => {
    function Test() {
      const [showLabel, setShowLabel] = React.useState(false);

      useIsoLayoutEffect(() => {
        setShowLabel(true);
      }, []);

      return (
        <div>
          {showLabel && <label htmlFor="control">Label</label>}
          <Checkbox.Root id="control" />
        </div>
      );
    }

    await render(<Test />);

    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Label').id,
    );
  });

  it('updates when the label mounts and unmounts', async () => {
    const { setProps } = await render(<TestToggleLabel showLabel={false} />);
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).not.toHaveAttribute('aria-labelledby');

    await setProps({ showLabel: true });
    expect(checkbox).toHaveAttribute('aria-labelledby', screen.getByText('Label').id);

    await setProps({ showLabel: false });
    expect(checkbox).not.toHaveAttribute('aria-labelledby');
  });

  it.each<[string, React.ReactNode, (element: HTMLElement) => void]>([
    [
      'retargets a label',
      <label htmlFor="other" id="target-label">
        Target
      </label>,
      (element) => {
        element.querySelector('label')!.htmlFor = 'target';
      },
    ],
    [
      'inserts a label',
      null,
      (element) => {
        const label = document.createElement('label');
        label.htmlFor = 'target';
        label.id = 'target-label';
        element.append(label);
      },
    ],
    [
      'removes an element that shadows the control id',
      <React.Fragment>
        <span id="target" />
        <label htmlFor="target" id="target-label">
          Target
        </label>
      </React.Fragment>,
      (element) => {
        element.querySelector('span')!.removeAttribute('id');
      },
    ],
  ])(
    'picks up a sibling layout effect that %s between two lookups',
    async (_, children, mutate) => {
      function Mutate() {
        const ref = React.useRef<HTMLDivElement>(null);
        useIsoLayoutEffect(() => {
          mutate(ref.current!);
        }, []);
        return <div ref={ref}>{children}</div>;
      }

      await render(
        <div>
          <Checkbox.Root id="first" />
          <Mutate />
          <Checkbox.Root id="target" data-testid="target" />
        </div>,
      );

      expect(screen.getByTestId('target')).toHaveAttribute('aria-labelledby', 'target-label');
    },
  );

  it('picks up a sibling layout effect that makes an earlier wrapped input unlabelable', async () => {
    function HideInput() {
      useIsoLayoutEffect(() => {
        document.getElementById('before')!.setAttribute('type', 'hidden');
      }, []);
      return null;
    }

    await render(
      <div>
        <Checkbox.Root id="first" />
        <label>
          <input id="before" />
          <HideInput />
          <Checkbox.Root data-testid="target" />
          Label
        </label>
      </div>,
    );

    expect(screen.getByTestId('target')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Label').id,
    );
  });

  it('uses a detached root label that is attached later', async () => {
    function Test() {
      const ref = React.useRef<HTMLDivElement>(null);
      const [label] = React.useState(() => {
        const element = document.createElement('label');
        element.textContent = 'Label';
        return element;
      });

      useIsoLayoutEffect(() => {
        ref.current!.append(label);
      }, [label]);

      return <div ref={ref}>{ReactDOM.createPortal(<Checkbox.Root />, label)}</div>;
    }

    // Strict Mode re-runs the effects after the label is attached, which would hide a miss.
    await render(<Test />, { strict: false });

    const label = screen.getByText('Label');
    expect(label.id).not.toBe('');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-labelledby', label.id);
  });

  it('only uses labels in the same shadow root', async () => {
    const host = document.createElement('div');
    const container = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(container);
    document.body.append(host);

    try {
      await render(
        <div>
          <label htmlFor="outside">Outside</label>
          {ReactDOM.createPortal(
            <React.Fragment>
              <label htmlFor="inside">Inside</label>
              <Checkbox.Root id="inside" data-testid="inside" />
              <Checkbox.Root id="outside" data-testid="outside" />
            </React.Fragment>,
            container,
          )}
        </div>,
      );

      const inside = container.querySelector('[data-testid="inside"]');
      const outside = container.querySelector('[data-testid="outside"]');
      const label = container.querySelector('label');

      expect(inside).toHaveAttribute('aria-labelledby', label?.id);
      expect(outside).not.toHaveAttribute('aria-labelledby');
    } finally {
      host.remove();
    }
  });
});

function TestToggleLabel({ showLabel }: { showLabel: boolean }) {
  return (
    <div>
      <Checkbox.Root id="control" />
      {showLabel && <label htmlFor="control">Label</label>}
    </div>
  );
}
