import { expect, describe, it, vi } from 'vitest';
import { Accordion } from '@base-ui/react/accordion';
import { screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testRenderPropWith: 'button',
    button: true,
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
  }));

  it('renders the disabled attribute when disabled', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item disabled>
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toBeDisabled();
    expect(trigger).not.toHaveAttribute('aria-disabled');
  });

  it('adds data-disabled when only the trigger is disabled', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger disabled>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute('data-disabled');
  });

  it('removes a disabled non-native trigger from the tab order', async () => {
    const { user } = await render(
      <Accordion.Root>
        <Accordion.Item disabled>
          <Accordion.Header>
            <Accordion.Trigger nativeButton={false} render={<span />}>
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(trigger).toHaveAttribute('tabindex', '-1');
    expect(trigger).not.toHaveAttribute('disabled');

    await user.keyboard('[Tab]');
    expect(trigger).not.toHaveFocus();
  });

  it('keeps a non-native trigger tabbable', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger nativeButton={false} render={<span />}>
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveAttribute('tabindex', '0');
  });

  it('does not render the root value as data-value', async () => {
    await render(
      <Accordion.Root value={['a', 'b']} multiple>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>header b</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel b</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers[0]).not.toHaveAttribute('data-value');
    expect(triggers[1]).not.toHaveAttribute('data-value');
  });

  it('renders data-index on every trigger including the first', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>first</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>second</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers[0]).toHaveAttribute('data-index', '0');
    expect(triggers[1]).toHaveAttribute('data-index', '1');
  });

  it('keeps data-panel-open instead of data-open', async () => {
    await render(
      <Accordion.Root value={['a']}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'header a' });
    expect(trigger).toHaveAttribute('data-panel-open');
    expect(trigger).not.toHaveAttribute('data-open');
  });

  it('passes item and merged disabled state to className and style callbacks', async () => {
    const classNameSpy = vi.fn(
      (state: Accordion.Trigger.State) =>
        `trigger-${state.index}-${state.disabled ? 'disabled' : 'enabled'}`,
    );
    const styleSpy = vi.fn((state: Accordion.Trigger.State) => ({
      opacity: state.open ? 1 : 0.5,
    }));

    await render(
      <Accordion.Root value={['a']}>
        <Accordion.Item value="a" disabled>
          <Accordion.Header>
            <Accordion.Trigger className={classNameSpy} style={styleSpy}>
              header a
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger disabled className={classNameSpy} style={styleSpy}>
              header b
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel b</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const triggers = screen.getAllByRole('button');
    expect(triggers[0]).toHaveClass('trigger-0-disabled');
    expect(triggers[0]).toHaveStyle({ opacity: '1' });
    expect(triggers[1]).toHaveClass('trigger-1-disabled');
    expect(triggers[1]).toHaveStyle({ opacity: '0.5' });

    expect(classNameSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        open: true,
        disabled: true,
      }),
    );
    expect(styleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1,
        open: false,
        disabled: true,
      }),
    );
  });
});
