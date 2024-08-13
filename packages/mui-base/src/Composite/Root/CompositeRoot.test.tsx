import * as React from 'react';
import { expect } from 'chai';
import { test } from 'mocha';
import { createRenderer, act, screen, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';
import { CompositeRoot } from './CompositeRoot';
import { CompositeItem } from '../Item/CompositeItem';

describe('<CompositeRoot />', () => {
  const { render } = createRenderer();

  describeConformance(<CompositeRoot />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('list', () => {
    test('controlled mode', async () => {
      function App() {
        const [activeIndex, setActiveIndex] = React.useState(0);
        return (
          <CompositeRoot activeIndex={activeIndex} onActiveIndexChange={setActiveIndex}>
            <CompositeItem data-testid="1">1</CompositeItem>
            <CompositeItem data-testid="2">2</CompositeItem>
            <CompositeItem data-testid="3">3</CompositeItem>
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('2')).to.have.attribute('data-active');
      expect(screen.getByTestId('2')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('2')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('2'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('3')).to.have.attribute('data-active');
      expect(screen.getByTestId('3')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('3')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('3'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('2')).to.have.attribute('data-active');
      expect(screen.getByTestId('2')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('2')).toHaveFocus();

      act(() => screen.getByTestId('1').focus());
      await flushMicrotasks();
      expect(screen.getByTestId('1')).to.have.attribute('data-active');
      expect(screen.getByTestId('1')).to.have.attribute('tabindex', '0');
    });

    test('uncontrolled mode', async () => {
      render(
        <CompositeRoot>
          <CompositeItem data-testid="1">1</CompositeItem>
          <CompositeItem data-testid="2">2</CompositeItem>
          <CompositeItem data-testid="3">3</CompositeItem>
        </CompositeRoot>,
      );

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('2')).to.have.attribute('data-active');
      expect(screen.getByTestId('2')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('2')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('2'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('3')).to.have.attribute('data-active');
      expect(screen.getByTestId('3')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('3')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('3'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('2')).to.have.attribute('data-active');
      expect(screen.getByTestId('2')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('2')).toHaveFocus();

      act(() => screen.getByTestId('1').focus());
      await flushMicrotasks();
      expect(screen.getByTestId('1')).to.have.attribute('data-active');
      expect(screen.getByTestId('1')).to.have.attribute('tabindex', '0');
    });
  });

  describe('grid', () => {
    test('uniform 1x1 items', async () => {
      function App() {
        return (
          // 1 to 9 numpad
          <CompositeRoot cols={3}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((i) => (
              <CompositeItem key={i} data-testid={i}>
                {i}
              </CompositeItem>
            ))}
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('4')).to.have.attribute('data-active');
      expect(screen.getByTestId('4')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('4')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('4'), { key: 'ArrowRight' });
      await flushMicrotasks();
      expect(screen.getByTestId('5')).to.have.attribute('data-active');
      expect(screen.getByTestId('5')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('5')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('5'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('8')).to.have.attribute('data-active');
      expect(screen.getByTestId('8')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('8')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('8'), { key: 'ArrowLeft' });
      await flushMicrotasks();
      expect(screen.getByTestId('7')).to.have.attribute('data-active');
      expect(screen.getByTestId('7')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('7')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('7'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('4')).to.have.attribute('data-active');
      expect(screen.getByTestId('4')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('4')).toHaveFocus();

      act(() => screen.getByTestId('9').focus());
      await flushMicrotasks();
      expect(screen.getByTestId('9')).to.have.attribute('data-active');
      expect(screen.getByTestId('9')).to.have.attribute('tabindex', '0');
    });

    test('wider item', async () => {
      function App() {
        return (
          // 1 to 9 numpad, but 4, 5 and 6 are one big button
          <CompositeRoot
            cols={3}
            itemSizes={[
              { width: 1, height: 1 },
              { width: 1, height: 1 },
              { width: 1, height: 1 },
              { width: 3, height: 1 },
              { width: 1, height: 1 },
              { width: 1, height: 1 },
              { width: 1, height: 1 },
            ]}
          >
            {['1', '2', '3', '456', '7', '8', '9'].map((i) => (
              <CompositeItem key={i} data-testid={i}>
                {i}
              </CompositeItem>
            ))}
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('456')).to.have.attribute('data-active');
      expect(screen.getByTestId('456')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('456')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('456'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('7')).to.have.attribute('data-active');
      expect(screen.getByTestId('7')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('7')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('7'), { key: 'ArrowRight' });
      await flushMicrotasks();
      expect(screen.getByTestId('8')).to.have.attribute('data-active');
      expect(screen.getByTestId('8')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('8')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('8'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('456')).to.have.attribute('data-active');
      expect(screen.getByTestId('456')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('456')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('456'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('1')).to.have.attribute('data-active');
      expect(screen.getByTestId('1')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('1')).toHaveFocus();

      act(() => screen.getByTestId('9').focus());
      await flushMicrotasks();
      expect(screen.getByTestId('9')).to.have.attribute('data-active');
      expect(screen.getByTestId('9')).to.have.attribute('tabindex', '0');
    });

    test('wider and taller item', async () => {
      function App() {
        return (
          // 1 to 9 numpad, but 4, 5, 7 and 8 are one big button
          <CompositeRoot
            cols={3}
            itemSizes={[
              { width: 1, height: 1 },
              { width: 1, height: 1 },
              { width: 1, height: 1 },
              { width: 2, height: 2 },
              { width: 1, height: 1 },
              { width: 1, height: 1 },
            ]}
          >
            {['1', '2', '3', '4578', '6', '9'].map((i) => (
              <CompositeItem key={i} data-testid={i}>
                {i}
              </CompositeItem>
            ))}
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('4578')).to.have.attribute('data-active');
      expect(screen.getByTestId('4578')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('4578')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('4578'), { key: 'ArrowRight' });
      await flushMicrotasks();
      expect(screen.getByTestId('6')).to.have.attribute('data-active');
      expect(screen.getByTestId('6')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('6')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('6'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('9')).to.have.attribute('data-active');
      expect(screen.getByTestId('9')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('9')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('9'), { key: 'ArrowLeft' });
      await flushMicrotasks();
      expect(screen.getByTestId('4578')).to.have.attribute('data-active');
      expect(screen.getByTestId('4578')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('4578')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('4578'), { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(screen.getByTestId('1')).to.have.attribute('data-active');
      expect(screen.getByTestId('1')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('1')).toHaveFocus();

      act(() => screen.getByTestId('9').focus());
      await flushMicrotasks();
      expect(screen.getByTestId('9')).to.have.attribute('data-active');
      expect(screen.getByTestId('9')).to.have.attribute('tabindex', '0');
    });

    test('grid flow', async () => {
      function App() {
        return (
          // 1 to 9 numpad, but 2, 3, 5 and 6 are one big button, and so are 7 and 8.
          // 4 is missing
          <CompositeRoot
            cols={3}
            itemSizes={[
              { width: 1, height: 1 },
              { width: 2, height: 2 },
              { width: 2, height: 1 },
              { width: 1, height: 1 },
            ]}
          >
            {['1', '2356', '78', '9'].map((i) => (
              <CompositeItem key={i} data-testid={i}>
                {i}
              </CompositeItem>
            ))}
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('78')).to.have.attribute('data-active');
      expect(screen.getByTestId('78')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('78')).toHaveFocus();
    });

    test('grid flow: dense', async () => {
      function App() {
        return (
          // 1 to 9 numpad, but 2, 3, 5 and 6 are one big button, and so are 7 and 8.
          // 9 is missing
          <CompositeRoot
            cols={3}
            itemSizes={[
              { width: 1, height: 1 },
              { width: 2, height: 2 },
              { width: 2, height: 1 },
              { width: 1, height: 1 },
            ]}
            dense
          >
            {['1', '2356', '78', '4'].map((i) => (
              <CompositeItem key={i} data-testid={i}>
                {i}
              </CompositeItem>
            ))}
          </CompositeRoot>
        );
      }

      render(<App />);

      act(() => screen.getByTestId('1').focus());
      expect(screen.getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(screen.getByTestId('1'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('4')).to.have.attribute('data-active');
      expect(screen.getByTestId('4')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('4')).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('4'), { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(screen.getByTestId('78')).to.have.attribute('data-active');
      expect(screen.getByTestId('78')).to.have.attribute('tabindex', '0');
      expect(screen.getByTestId('78')).toHaveFocus();
    });
  });
});
