import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import * as Tabs from '@base_ui/react/Tabs';
import { useTab } from './useTab';

describe('useTab', () => {
  const { render } = createRenderer();

  describe('getRootProps', () => {
    it('returns props for root slot', () => {
      function TestTab() {
        const rootRef = React.createRef<HTMLDivElement>();
        const { getRootProps } = useTab({ rootRef });
        return <button {...getRootProps()} />;
      }

      function Test() {
        return (
          <Tabs.Root defaultValue={1}>
            <Tabs.List>
              <TestTab />
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { getByRole } = render(<Test />);

      const tab = getByRole('tab');
      expect(tab).not.to.equal(null);
    });

    it('forwards external props including event handlers', () => {
      const handleClick = spy();

      function TestTab() {
        const rootRef = React.createRef<HTMLDivElement>();
        const { getRootProps } = useTab({ rootRef });
        return (
          <button
            {...getRootProps({
              'data-testid': 'test-tab',
              onClick: handleClick,
            } as React.ComponentPropsWithoutRef<'button'>)}
          />
        );
      }

      function Test() {
        return (
          <Tabs.Root defaultValue={1}>
            <Tabs.List>
              <TestTab />
            </Tabs.List>
          </Tabs.Root>
        );
      }

      render(<Test />);

      const tab = screen.getByTestId('test-tab');
      expect(tab).not.to.equal(null);

      fireEvent.click(tab);
      expect(handleClick.callCount).to.equal(1);
    });
  });
});
