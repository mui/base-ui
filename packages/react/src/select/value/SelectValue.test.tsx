import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { spy } from 'sinon';
import { expect } from 'chai';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Value />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  describe('prop: children', () => {
    it('accepts a function with a value parameter', async () => {
      const children = spy();
      await render(
        <Select.Root value="1">
          <Select.Trigger>
            <Select.Value>
              {(value) => {
                children(value);
                return value;
              }}
            </Select.Value>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="1">one</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      fireEvent.click(screen.getByText('1'));
      await flushMicrotasks();

      expect(children.firstCall.firstArg).to.equal('1');
      expect(children.firstCall.lastArg).to.equal('1');
    });

    it('overrides the text when children is a string', async () => {
      await render(
        <Select.Root value="1">
          <Select.Value>one</Select.Value>
        </Select.Root>,
      );

      expect(screen.getByText('one')).not.to.equal(null);
    });
  });

  describe('prop: items (object format)', () => {
    it('displays the label from items object when no children are provided', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
        mono: 'Monospace',
      };

      await render(
        <Select.Root value="sans" items={items}>
          <Select.Trigger>
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="sans">Sans-serif</Select.Item>
                <Select.Item value="serif">Serif</Select.Item>
                <Select.Item value="mono">Monospace</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Sans-serif');
    });

    it('updates the label when value changes with items object', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
        mono: 'Monospace',
      };

      function App() {
        const [value, setValue] = React.useState<string | null>('sans');
        return (
          <div>
            <button onClick={() => setValue('serif')}>serif</button>
            <button onClick={() => setValue('mono')}>mono</button>
            <Select.Root value={value} onValueChange={setValue} items={items}>
              <Select.Trigger>
                <Select.Value data-testid="value" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="sans">Sans-serif</Select.Item>
                    <Select.Item value="serif">Serif</Select.Item>
                    <Select.Item value="mono">Monospace</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('value')).to.have.text('Sans-serif');

      await user.click(screen.getByRole('button', { name: 'serif' }));
      expect(screen.getByTestId('value')).to.have.text('Serif');

      await user.click(screen.getByRole('button', { name: 'mono' }));
      expect(screen.getByTestId('value')).to.have.text('Monospace');
    });

    it('falls back to raw value when value is not in items object', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
      };

      await render(
        <Select.Root value="unknown" items={items}>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('unknown');
    });

    it('supports ReactNode labels in items object', async () => {
      const items = {
        sans: <span>Sans-serif</span>,
        serif: <span>Serif</span>,
      };

      await render(
        <Select.Root value="sans" items={items}>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value').querySelector('span')).to.have.text('Sans-serif');
    });

    it('can lookup null value', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
        null: 'Null',
      };

      await render(
        <Select.Root value={null} items={items}>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Null');
    });
  });

  describe('prop: items (array format)', () => {
    it('displays the label from items array when no children are provided', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
        { value: 'mono', label: 'Monospace' },
      ];

      await render(
        <Select.Root value="serif" items={items}>
          <Select.Trigger>
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="sans">Sans-serif</Select.Item>
                <Select.Item value="serif">Serif</Select.Item>
                <Select.Item value="mono">Monospace</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Serif');
    });

    it('updates the label when value changes with items array', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
        { value: 'mono', label: 'Monospace' },
      ];

      function App() {
        const [value, setValue] = React.useState<string | null>('sans');
        return (
          <div>
            <button onClick={() => setValue('serif')}>serif</button>
            <button onClick={() => setValue('mono')}>mono</button>
            <Select.Root value={value} onValueChange={setValue} items={items}>
              <Select.Trigger>
                <Select.Value data-testid="value" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="sans">Sans-serif</Select.Item>
                    <Select.Item value="serif">Serif</Select.Item>
                    <Select.Item value="mono">Monospace</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('value')).to.have.text('Sans-serif');

      await user.click(screen.getByRole('button', { name: 'serif' }));
      expect(screen.getByTestId('value')).to.have.text('Serif');

      await user.click(screen.getByRole('button', { name: 'mono' }));
      expect(screen.getByTestId('value')).to.have.text('Monospace');
    });

    it('falls back to raw value when value is not in items array', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
      ];

      await render(
        <Select.Root value="unknown" items={items}>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('unknown');
    });

    it('supports ReactNode labels in items array', async () => {
      const items = [
        { value: 'bold', label: <strong>Bold Text</strong> },
        { value: 'italic', label: <em>Italic Text</em> },
      ];

      await render(
        <Select.Root value="bold" items={items}>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value').querySelector('strong')).to.have.text('Bold Text');
    });
  });

  describe('children prop takes precedence over items', () => {
    it('uses children string over items object', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
      };

      await render(
        <Select.Root value="sans" items={items}>
          <Select.Value data-testid="value">Custom Text</Select.Value>
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Custom Text');
    });

    it('uses children function over items array', async () => {
      const items = [
        { value: 'sans', label: 'Sans-serif' },
        { value: 'serif', label: 'Serif' },
      ];

      await render(
        <Select.Root value="sans" items={items}>
          <Select.Value data-testid="value">{(value) => `Custom: ${value}`}</Select.Value>
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Custom: sans');
    });
  });

  it('changes text when the value changes', async () => {
    function App() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <div>
          <button onClick={() => setValue('1')}>1</button>
          <button onClick={() => setValue('2')}>2</button>
          <button onClick={() => setValue(null)}>null</button>
          <Select.Root value={value} onValueChange={setValue}>
            <Select.Trigger>
              <Select.Value data-testid="value">{(val) => val ?? 'initial'}</Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">1</Select.Item>
                  <Select.Item value="2">2</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByText('initial'));
    await flushMicrotasks();

    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByTestId('value')).to.have.text('1');

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('value')).to.have.text('2');

    await user.click(screen.getByRole('button', { name: 'null' }));
    expect(screen.getByTestId('value')).to.have.text('initial');
  });

  describe('prop: multiple', () => {
    it('displays comma-separated labels for multiple values with items object', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
        mono: 'Monospace',
      };

      await render(
        <Select.Root value={['sans', 'serif']} items={items} multiple>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('sans, serif');
    });

    it('displays comma-separated values for multiple values with items array', async () => {
      await render(
        <Select.Root value={['serif', 'mono']} multiple>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('serif, mono');
    });

    it('displays single value when only one value is selected in multiple mode', async () => {
      await render(
        <Select.Root value={['sans']} multiple>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('sans');
    });

    it('displays empty when no values are selected in multiple mode', async () => {
      await render(
        <Select.Root value={[]} multiple>
          <Select.Value data-testid="value" />
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('');
    });

    it('children function receives array of values in multiple mode', async () => {
      const children = spy();
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
      };

      await render(
        <Select.Root value={['sans', 'serif']} items={items} multiple>
          <Select.Value>
            {(values) => {
              children(values);
              return `Selected: ${Array.isArray(values) ? values.join(' + ') : values}`;
            }}
          </Select.Value>
        </Select.Root>,
      );

      expect(children.firstCall.firstArg).to.deep.equal(['sans', 'serif']);
      expect(screen.getByText('Selected: sans + serif')).not.to.equal(null);
    });

    it('children prop takes precedence over items in multiple mode', async () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
      };

      await render(
        <Select.Root value={['sans', 'serif']} items={items} multiple>
          <Select.Value data-testid="value">Custom Multiple Text</Select.Value>
        </Select.Root>,
      );

      expect(screen.getByTestId('value')).to.have.text('Custom Multiple Text');
    });

    it('defaults to empty array when no value is provided', async () => {
      const renderValue = spy();

      await render(
        <Select.Root multiple>
          <Select.Value>{renderValue}</Select.Value>
        </Select.Root>,
      );

      expect(renderValue.firstCall.firstArg).to.deep.equal([]);
    });
  });
});
