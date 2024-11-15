import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, fireEvent } from '@mui/internal-test-utils';
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
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(item3).to.have.attribute('data-active');
      expect(item3).to.have.attribute('tabindex', '0');
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowUp' });
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
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(item3).to.have.attribute('data-active');
      expect(item3).to.have.attribute('tabindex', '0');
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      expect(item2).to.have.attribute('data-active');
      expect(item2).to.have.attribute('tabindex', '0');
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowUp' });
      expect(item1).to.have.attribute('data-active');
      expect(item1).to.have.attribute('tabindex', '0');
      expect(item1).toHaveFocus();
    });

    describe('prop: isRtl', () => {
      it('horizontal orientation', async () => {
        const { getByTestId } = render(
          <CompositeRoot isRtl orientation="horizontal">
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
        expect(item1).to.have.attribute('data-active');

        fireEvent.keyDown(item1, { key: 'ArrowLeft' });
        expect(item2).to.have.attribute('data-active');
        expect(item2).to.have.attribute('tabindex', '0');
        expect(item2).toHaveFocus();

        fireEvent.keyDown(item2, { key: 'ArrowLeft' });
        expect(item3).to.have.attribute('data-active');
        expect(item3).to.have.attribute('tabindex', '0');
        expect(item3).toHaveFocus();

        fireEvent.keyDown(item3, { key: 'ArrowRight' });
        expect(item2).to.have.attribute('data-active');
        expect(item2).to.have.attribute('tabindex', '0');
        expect(item2).toHaveFocus();

        fireEvent.keyDown(item2, { key: 'ArrowRight' });
        expect(item1).to.have.attribute('data-active');
        expect(item1).to.have.attribute('tabindex', '0');
        expect(item1).toHaveFocus();

        // loop backward
        fireEvent.keyDown(item1, { key: 'ArrowRight' });
        expect(item3).to.have.attribute('data-active');
        expect(item3).to.have.attribute('tabindex', '0');
        expect(item3).toHaveFocus();
      });

      it('both horizontal and vertical orientation', async () => {
        const { getByTestId } = render(
          <CompositeRoot isRtl orientation="both">
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

        fireEvent.keyDown(item1, { key: 'ArrowLeft' });
        expect(item2).to.have.attribute('data-active');
        expect(item2).to.have.attribute('tabindex', '0');
        expect(item2).toHaveFocus();

        fireEvent.keyDown(item2, { key: 'ArrowLeft' });
        expect(item3).to.have.attribute('data-active');
        expect(item3).to.have.attribute('tabindex', '0');
        expect(item3).toHaveFocus();

        fireEvent.keyDown(item3, { key: 'ArrowRight' });
        expect(item2).to.have.attribute('data-active');
        expect(item2).to.have.attribute('tabindex', '0');
        expect(item2).toHaveFocus();

        fireEvent.keyDown(item2, { key: 'ArrowRight' });
        expect(item1).to.have.attribute('data-active');
        expect(item1).to.have.attribute('tabindex', '0');
        expect(item1).toHaveFocus();

        fireEvent.keyDown(item1, { key: 'ArrowDown' });
        expect(item2).to.have.attribute('data-active');
        expect(item2).to.have.attribute('tabindex', '0');
        expect(item2).toHaveFocus();

        fireEvent.keyDown(item2, { key: 'ArrowDown' });
        expect(item3).to.have.attribute('data-active');
        expect(item3).to.have.attribute('tabindex', '0');
        expect(item3).toHaveFocus();
      });
    });
  });

  describe('grid', () => {
    it('uniform 1x1 items', async () => {
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

      const { getByTestId } = await render(<App />);

      act(() => getByTestId('1').focus());
      expect(getByTestId('1')).to.have.attribute('data-active');

      fireEvent.keyDown(getByTestId('1'), { key: 'ArrowDown' });
      expect(getByTestId('4')).to.have.attribute('data-active');
      expect(getByTestId('4')).to.have.attribute('tabindex', '0');
      expect(getByTestId('4')).toHaveFocus();

      fireEvent.keyDown(getByTestId('4'), { key: 'ArrowRight' });
      expect(getByTestId('5')).to.have.attribute('data-active');
      expect(getByTestId('5')).to.have.attribute('tabindex', '0');
      expect(getByTestId('5')).toHaveFocus();

      fireEvent.keyDown(getByTestId('5'), { key: 'ArrowDown' });
      expect(getByTestId('8')).to.have.attribute('data-active');
      expect(getByTestId('8')).to.have.attribute('tabindex', '0');
      expect(getByTestId('8')).toHaveFocus();

      fireEvent.keyDown(getByTestId('8'), { key: 'ArrowLeft' });
      expect(getByTestId('7')).to.have.attribute('data-active');
      expect(getByTestId('7')).to.have.attribute('tabindex', '0');
      expect(getByTestId('7')).toHaveFocus();

      fireEvent.keyDown(getByTestId('7'), { key: 'ArrowUp' });
      expect(getByTestId('4')).to.have.attribute('data-active');
      expect(getByTestId('4')).to.have.attribute('tabindex', '0');
      expect(getByTestId('4')).toHaveFocus();

      act(() => getByTestId('9').focus());
      expect(getByTestId('9')).to.have.attribute('data-active');
      expect(getByTestId('9')).to.have.attribute('tabindex', '0');
    });
  });
});
