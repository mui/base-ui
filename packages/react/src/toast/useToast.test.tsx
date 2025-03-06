import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
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
            <Toast.Root key={t.id} toast={t} data-testid="root">
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
            <Toast.Root key={t.id} toast={t} data-testid="root">
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
            <Toast.Root key={t.id} toast={t} data-testid="root">
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

  describe('promise', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToast();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Content>
            <Toast.Title data-testid="title">{t.title}</Toast.Title>
            <Toast.Description data-testid="description">{t.description}</Toast.Description>
          </Toast.Content>
          <span>{t.type}</span>
        </Toast.Root>
      ));
    }

    it('displays success state as title after promise resolves', async () => {
      function AddButton() {
        const { promise } = useToast();
        return (
          <button
            onClick={() => {
              promise(
                new Promise((res) => {
                  setTimeout(() => {
                    res('success');
                  }, 1000);
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: 'error',
                },
              );
            }}
          >
            add
          </button>
        );
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

      expect(screen.getByTestId('title')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('title')).to.have.text('success');
    });

    it('displays error state as title after promise rejects', async () => {
      function AddButton() {
        const { promise } = useToast();
        return (
          <button
            onClick={() => {
              promise(
                new Promise((res, rej) => {
                  setTimeout(() => {
                    rej(new Error('error'));
                  }, 1000);
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: 'error',
                },
              ).catch(() => {
                // Explicitly catch rejection to prevent test failure
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
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.getByTestId('title')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('title')).to.have.text('error');
    });

    it('passes data when success is a function', async () => {
      function AddButton() {
        const { promise } = useToast();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res) => {
                  res('test success');
                }),
                {
                  loading: 'loading',
                  success: (data) => `${data}`,
                  error: 'error',
                },
              )
            }
          >
            add
          </button>
        );
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

      expect(screen.getByTestId('title')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('title')).to.have.text('test success');
    });

    it('passes data when error is a function', async () => {
      function AddButton() {
        const { promise } = useToast();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res, rej) => {
                  rej(new Error('test error'));
                }),
                {
                  loading: 'loading',
                  success: 'success',
                  error: (error: Error) => `${error.message}`,
                },
              ).catch(() => {
                // Explicitly catch rejection to prevent test failure
              })
            }
          >
            add
          </button>
        );
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

      expect(screen.getByTestId('title')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('title')).to.have.text('test error');
    });

    it('supports custom options', async () => {
      function AddButton() {
        const { promise } = useToast();
        return (
          <button
            onClick={() =>
              promise(
                new Promise((res) => {
                  res('success');
                }),
                {
                  loading: {
                    title: 'loading title',
                    description: 'loading description',
                  },
                  success: 'success',
                  error: 'error',
                },
              )
            }
          >
            add
          </button>
        );
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

      expect(screen.getByTestId('title')).to.have.text('loading title');
      expect(screen.getByTestId('description')).to.have.text('loading description');

      await flushMicrotasks();
    });
  });

  describe('update', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToast();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Content>
            <Toast.Title data-testid="title">{t.title}</Toast.Title>
          </Toast.Content>
        </Toast.Root>
      ));
    }

    it('updates the toast', async () => {
      function AddButton() {
        const { add, update } = useToast();
        const idRef = React.useRef<string | null>(null);
        return (
          <React.Fragment>
            <button
              type="button"
              onClick={() => {
                idRef.current = add({ title: 'test' });
              }}
            >
              add
            </button>
            <button
              type="button"
              onClick={() => {
                if (idRef.current) {
                  update(idRef.current, { title: 'updated' });
                }
              }}
            >
              update
            </button>
          </React.Fragment>
        );
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

      expect(screen.getByTestId('title')).to.have.text('test');

      const updateButton = screen.getByRole('button', { name: 'update' });
      fireEvent.click(updateButton);

      expect(screen.getByTestId('title')).to.have.text('updated');
    });
  });

  describe('remove', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToast();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Content>
            <Toast.Title data-testid="title">{t.title}</Toast.Title>
          </Toast.Content>
        </Toast.Root>
      ));
    }

    it('removes the toast', async () => {
      function AddButton() {
        const { add, remove } = useToast();
        const idRef = React.useRef<string | null>(null);
        return (
          <React.Fragment>
            <button
              onClick={() => {
                idRef.current = add({ title: 'test' });
              }}
            >
              add
            </button>
            <button
              onClick={() => {
                if (idRef.current) {
                  remove(idRef.current);
                }
              }}
            >
              remove
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      const addButton = screen.getByRole('button', { name: 'add' });
      fireEvent.click(addButton);

      expect(screen.getByTestId('root')).not.to.equal(null);

      const removeButton = screen.getByRole('button', { name: 'remove' });
      fireEvent.click(removeButton);

      expect(screen.queryByTestId('root')).to.equal(null);
    });
  });
});
