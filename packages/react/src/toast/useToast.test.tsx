import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer } from '#test-utils';
import { useToast } from './useToast';
import { List } from './utils/test-utils';

describe('useToast', () => {
  describe('add', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    it('adds a toast to the viewport that auto-dismisses after 5s by default', async () => {
      function AddButton() {
        const { add } = useToast();
        return (
          <button
            onClick={() => {
              add({
                title: 'test',
              });
            }}
          >
            add
          </button>
        );
      }

      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.queryByTestId('root')).not.to.equal(null);

      clock.tick(5000);

      expect(screen.queryByTestId('root')).to.equal(null);
    });

    describe('option: timeout', () => {
      it('dismisses the toast after the specified timeout', async () => {
        function AddButton() {
          const { add } = useToast();
          return <button onClick={() => add({ title: 'test', timeout: 1000 })}>add</button>;
        }

        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('root')).not.to.equal(null);

        clock.tick(1000);

        expect(screen.queryByTestId('root')).to.equal(null);
      });
    });

    describe('option: title', () => {
      it('renders the title', async () => {
        function AddButton() {
          const { add } = useToast();
          return (
            <button
              onClick={() =>
                add({
                  title: 'title',
                  description: 'description',
                })
              }
            >
              add
            </button>
          );
        }

        function CustomList() {
          const { toasts } = useToast();
          return toasts.map((t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Content>
                <Toast.Title data-testid="title">{t.title}</Toast.Title>
              </Toast.Content>
            </Toast.Root>
          ));
        }

        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('title')).to.have.text('title');
      });
    });

    describe('option: description', () => {
      it('renders the description', async () => {
        function AddButton() {
          const { add } = useToast();
          return (
            <button
              onClick={() =>
                add({
                  title: 'title',
                  description: 'description',
                })
              }
            >
              add
            </button>
          );
        }

        function CustomList() {
          const { toasts } = useToast();
          return toasts.map((t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Content>
                <Toast.Description data-testid="description">{t.description}</Toast.Description>
              </Toast.Content>
            </Toast.Root>
          ));
        }

        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('description')).to.have.text('description');
      });
    });

    describe('option: type', () => {
      it('renders the type', async () => {
        function AddButton() {
          const { add } = useToast();
          return <button onClick={() => add({ title: 'test', type: 'success' })}>add</button>;
        }

        function CustomList() {
          const { toasts } = useToast();
          return toasts.map((t) => (
            <Toast.Root toast={t} data-testid="root">
              <Toast.Content>
                <Toast.Title data-testid="title">{t.title}</Toast.Title>
              </Toast.Content>
              <span>{t.type}</span>
            </Toast.Root>
          ));
        }

        await render(
          <Toast.Provider>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        expect(screen.queryByTestId('title')).to.have.text('test');
        expect(screen.queryByText('success')).not.to.equal(null);
      });
    });
  });
});
