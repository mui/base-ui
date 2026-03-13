import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent, act } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui/react/number-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { CHANGE_VALUE_TICK_DELAY, START_AUTO_CHANGE_DELAY } from '../utils/constants';

describe('<NumberField.Increment />', () => {
  const { render, clock } = createRenderer();

  describeConformance(<NumberField.Increment />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(<NumberField.Root>{node}</NumberField.Root>);
    },
  }));

  it('has increase label', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Increment />
      </NumberField.Root>,
    );
    expect(screen.queryByLabelText('Increase')).not.to.equal(null);
  });

  it('increments starting from 0 click', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('0');
  });

  it('increments to 1 starting from defaultValue=0 click', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('1');
  });

  it('first increment after external controlled update', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<number | null>(null);
      return (
        <NumberField.Root value={value} onValueChange={setValue}>
          <NumberField.Input />
          <NumberField.Increment />
          <button onClick={() => setValue(1.23456)}>external</button>
        </NumberField.Root>
      );
    }

    const { user } = await render(<Controlled />);
    const input = screen.getByRole('textbox');
    const increase = screen.getByLabelText('Increase');

    await user.click(screen.getByText('external'));
    expect(input).to.have.value((1.23456).toLocaleString(undefined, { minimumFractionDigits: 5 }));

    await user.click(increase);
    expect(input).to.have.value((2.235).toLocaleString(undefined, { minimumFractionDigits: 3 }));
  });

  it('only calls onValueChange once per increment', async () => {
    const handleValueChange = spy();
    const { user } = await render(
      <NumberField.Root onValueChange={handleValueChange}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');

    await user.click(button);
    expect(handleValueChange.callCount).to.equal(1);

    await user.click(button);
    expect(handleValueChange.callCount).to.equal(2);
  });

  describe('press and hold', () => {
    clock.withFakeTimers();

    it('increments continuously when holding pointerdown', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });

    it('stops calling onValueChange once max is reached', async () => {
      const handleValueChange = spy();
      await render(
        <NumberField.Root defaultValue={9} max={10} onValueChange={handleValueChange}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('10');
      expect(handleValueChange.callCount).to.equal(1);

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY);
      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('10');
      expect(handleValueChange.callCount).to.equal(1);

      fireEvent.pointerUp(button);
    });

    it('does not increment twice with pointerdown and click', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1
      fireEvent.pointerUp(button);
      fireEvent.click(button, { detail: 1 });

      expect(input).to.have.value('1');
    });

    it('should stop incrementing after mouseleave', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });

    it('should start incrementing again after mouseleave then mouseenter', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x5

      expect(input).to.have.value('5');
    });

    it('should not start incrementing again after mouseleave then mouseenter after pointerup', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.pointerDown(button); // onChange x1

      expect(input).to.have.value('1');

      clock.tick(START_AUTO_CHANGE_DELAY);

      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x2
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x3
      clock.tick(CHANGE_VALUE_TICK_DELAY); // onChange x4

      expect(input).to.have.value('4');

      fireEvent.pointerUp(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseLeave(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');

      fireEvent.mouseEnter(button);

      clock.tick(CHANGE_VALUE_TICK_DELAY);

      expect(input).to.have.value('4');
    });
  });

  it('should not increment when readOnly', async () => {
    await render(
      <NumberField.Root readOnly>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('textbox')).to.have.value('');
  });

  it('should increment when input is dirty but not blurred (click)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button'));

    expect(input).to.have.value('101');
  });

  it('should increment when input is dirty but not blurred (pointerdown)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const input = screen.getByRole('textbox');

    await act(() => input.focus());

    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.pointerDown(screen.getByRole('button'));

    expect(input).to.have.value('101');
  });

  it('treats pen pointer as touch-like', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');

    fireEvent.pointerDown(button, { pointerType: 'pen', button: 0 });

    expect(document.activeElement).not.to.equal(input);
  });

  it('always increments on quick touch (touchend that occurs before TOUCH_TIMEOUT)', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');

    fireEvent.touchStart(button);
    fireEvent.mouseEnter(button);
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });
    fireEvent.touchEnd(button);

    expect(input).to.have.value('1');

    fireEvent.touchStart(button);
    // No mouseenter occurs after the first focus
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    fireEvent.click(button, { detail: 1 });
    fireEvent.touchEnd(button);

    expect(input).to.have.value('2');
  });

  it.skipIf(isJSDOM)('fires onValueCommitted once on first soft tap (touch)', async () => {
    const onValueCommitted = spy();
    await render(
      <NumberField.Root defaultValue={0} onValueCommitted={onValueCommitted}>
        <NumberField.Increment />
        <NumberField.Input />
      </NumberField.Root>,
    );

    const button = screen.getByLabelText('Increase');

    // Simulate the typical sequence with a 300ms tap delay producing mouse compatibility events
    fireEvent.touchStart(button);
    fireEvent.pointerDown(button, { pointerType: 'touch' });
    // No movement; quick tap
    fireEvent.touchEnd(button);
    // Compatibility mouse events and click
    fireEvent.mouseEnter(button);
    fireEvent.click(button, { detail: 1 });

    expect(onValueCommitted.callCount).to.equal(1);
    expect(onValueCommitted.firstCall.args[0]).to.equal(1);
  });

  describe('prop: snapOnStep', () => {
    it('should increment by exact step without rounding when snapOnStep is false', async () => {
      await render(
        <NumberField.Root defaultValue={2.7} step={2} snapOnStep={false}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).to.have.value((4.7).toLocaleString());
    });

    it('should snap on increment when snapOnStep is true', async () => {
      await render(
        <NumberField.Root defaultValue={1.3} snapOnStep>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).to.have.value('2');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '1.9' } });
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).to.have.value('2');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '-0.2' } });
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).to.have.value('0');
    });

    it('should increment with respect to the min value', async () => {
      await render(
        <NumberField.Root defaultValue={1} min={1} step={2} snapOnStep>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.click(button);
      expect(input).to.have.value('3');

      fireEvent.click(button);
      expect(input).to.have.value('5');

      fireEvent.change(input, { target: { value: '1.112' } });
      fireEvent.click(button);
      expect(input).to.have.value('3');

      fireEvent.change(input, { target: { value: '0.999' } });
      fireEvent.click(button);
      expect(input).to.have.value('1');
    });
  });

  describe('disabled state', () => {
    it('should not increment when root is disabled', async () => {
      const handleValueChange = spy();
      await render(
        <NumberField.Root disabled onValueChange={handleValueChange}>
          <NumberField.Increment />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByRole('textbox')).to.have.value('');
      expect(handleValueChange.callCount).to.equal(0);
    });

    it('should not increment when button is disabled', async () => {
      const handleValueChange = spy();
      await render(
        <NumberField.Root defaultValue={0} onValueChange={handleValueChange}>
          <NumberField.Increment disabled />
          <NumberField.Input />
        </NumberField.Root>,
      );
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(input).to.have.value('0');

      fireEvent.pointerDown(button);
      expect(handleValueChange.callCount).to.equal(0);
      expect(input).to.have.value('0');
    });

    describe('prop: className', () => {
      it('when root is disabled', async () => {
        const classNameSpy = spy();
        await render(
          <NumberField.Root disabled>
            <NumberField.Increment className={classNameSpy} />
            <NumberField.Input />
          </NumberField.Root>,
        );

        expect(classNameSpy.lastCall.args[0]).to.have.property('disabled', true);
      });

      it('when button is disabled', async () => {
        const classNameSpy = spy();
        await render(
          <NumberField.Root>
            <NumberField.Increment disabled className={classNameSpy} />
            <NumberField.Input />
          </NumberField.Root>,
        );

        expect(classNameSpy.lastCall.args[0]).to.have.property('disabled', true);
      });
    });
  });
});
