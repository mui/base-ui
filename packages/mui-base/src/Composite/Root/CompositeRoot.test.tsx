import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';
import { CompositeItem } from '../Item/CompositeItem';
import { CompositeRoot } from './CompositeRoot';

describe('Composite', () => {
  const { render } = createRenderer();

  describe('list', () => {
    it('controlled mode', async () => {
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

      const { getByTestId } = render(<App />);

      const item1 = getByTestId('1');
      const item2 = getByTestId('2');
      const item3 = getByTestId('3');

      act(() => item1.focus());

      expect(item1).to.have.attribute('data-active');

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(item3).to.have.attribute('data-active');
      expect(item3).to.have.attribute('tabindex', '0');
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(item1).to.have.attribute('data-active');
      expect(item1).to.have.attribute('tabindex', '0');
      expect(item1).toHaveFocus();
    });

    it('uncontrolled mode', async () => {
      const { getByTestId } = render(
        <CompositeRoot>
          <CompositeItem data-testid="1">1</CompositeItem>
          <CompositeItem data-testid="2">2</CompositeItem>
          <CompositeItem data-testid="3">3</CompositeItem>
        </CompositeRoot>,
      );

      const item1 = getByTestId('1');
      const item2 = getByTestId('2');
      const item3 = getByTestId('3');

      act(() => item1.focus());

      expect(item1).to.have.attribute('data-active');

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      await flushMicrotasks();
      expect(item3).to.have.attribute('data-active');
      expect(item3).to.have.attribute('tabindex', '0');
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowUp' });
      await flushMicrotasks();
      expect(item1).to.have.attribute('data-active');
      expect(item1).to.have.attribute('tabindex', '0');
      expect(item1).toHaveFocus();
    });
  });
});
