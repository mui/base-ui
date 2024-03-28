import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { Tabs } from '../Tabs';
import { useTabPanel } from './useTabPanel';

describe('useTabPanel', () => {
  const { render } = createRenderer();

  describe('getRootProps', () => {
    it('returns props for root slot', () => {
      const rootRef = React.createRef<HTMLDivElement>();
      function TestTabPanel() {
        const { getRootProps } = useTabPanel({ rootRef, id: 'test-tabpanel', value: 0 });
        return <div {...getRootProps()} />;
      }

      function Test() {
        return (
          <Tabs>
            <TestTabPanel />
          </Tabs>
        );
      }

      render(<Test />);

      const tabpanel = document.querySelector('#test-tabpanel');
      expect(tabpanel).to.equal(rootRef.current);
    });

    it('forwards external props including event handlers', () => {
      const handleClick = spy();
      const rootRef = React.createRef<HTMLElement>();

      function TestTabPanel() {
        const { getRootProps } = useTabPanel({ rootRef, value: 0 });
        return <div {...getRootProps({ 'data-testid': 'test-tabpanel', onClick: handleClick })} />;
      }

      function Test() {
        return (
          <Tabs>
            <TestTabPanel />
          </Tabs>
        );
      }

      render(<Test />);

      const tabPanel = screen.getByTestId('test-tabpanel');
      expect(tabPanel).not.to.equal(null);

      fireEvent.click(tabPanel);
      expect(handleClick.callCount).to.equal(1);
    });
  });
});
