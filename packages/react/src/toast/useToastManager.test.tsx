import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer } from '#test-utils';
import { useToastManager } from './useToastManager';
import { List } from './utils/test-utils';

describe('useToast', () => {
  describe('add', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    it('adds a toast to the viewport that auto-dismisses after 5s by default', async () => {
      function AddButton() {
        const { add } = useToastManager();
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
          const { add } = useToastManager();
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
          const { add } = useToastManager();
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
          const { toasts } = useToastManager();
          return toasts.map((t) => (
            <Toast.Root key={t.id} toast={t} data-testid="root">
              <Toast.Title data-testid="title">{t.title}</Toast.Title>
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
          const { add } = useToastManager();
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
          const { toasts } = useToastManager();
          return toasts.map((t) => (
            <Toast.Root key={t.id} toast={t} data-testid="root">
              <Toast.Description data-testid="description">{t.description}</Toast.Description>
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
          const { add } = useToastManager();
          return <button onClick={() => add({ title: 'test', type: 'success' })}>add</button>;
        }

        function CustomList() {
          const { toasts } = useToastManager();
          return toasts.map((t) => (
            <Toast.Root key={t.id} toast={t} data-testid="root">
              <Toast.Title data-testid="title">{t.title}</Toast.Title>
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

    describe('option: onClose', () => {
      it('calls onClose when the toast is closed', async () => {
        const onCloseSpy = spy();

        function AddButton() {
          const { add, close } = useToastManager();
          const idRef = React.useRef<string | null>(null);
          return (
            <React.Fragment>
              <button
                onClick={() => {
                  idRef.current = add({
                    title: 'test',
                    onClose: onCloseSpy,
                  });
                }}
              >
                add
              </button>
              <button
                onClick={() => {
                  if (idRef.current) {
                    close(idRef.current);
                  }
                }}
              >
                close
              </button>
            </React.Fragment>
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

        const addButton = screen.getByRole('button', { name: 'add' });
        fireEvent.click(addButton);

        expect(onCloseSpy.callCount).to.equal(0);

        const closeButton = screen.getByRole('button', { name: 'close' });
        fireEvent.click(closeButton);

        expect(onCloseSpy.callCount).to.equal(1);
      });

      it('calls onClose when the toast auto-dismisses', async () => {
        const onCloseSpy = spy();

        function AddButton() {
          const { add } = useToastManager();
          return (
            <button
              onClick={() => {
                add({
                  title: 'test',
                  timeout: 1000,
                  onClose: onCloseSpy,
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

        expect(onCloseSpy.callCount).to.equal(0);

        clock.tick(1000);

        expect(onCloseSpy.callCount).to.equal(1);
      });
    });

    describe('option: onRemove', () => {
      it('calls onRemove when the toast is removed', async () => {
        const onRemoveSpy = spy();

        function AddButton() {
          const { add, close } = useToastManager();
          const idRef = React.useRef<string | null>(null);
          return (
            <React.Fragment>
              <button
                onClick={() => {
                  idRef.current = add({
                    title: 'test',
                    onRemove: onRemoveSpy,
                  });
                }}
              >
                add
              </button>
              <button
                onClick={() => {
                  if (idRef.current) {
                    close(idRef.current);
                  }
                }}
              >
                close
              </button>
            </React.Fragment>
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

        const addButton = screen.getByRole('button', { name: 'add' });
        fireEvent.click(addButton);

        expect(onRemoveSpy.callCount).to.equal(0);

        const closeButton = screen.getByRole('button', { name: 'close' });
        fireEvent.click(closeButton);

        expect(onRemoveSpy.callCount).to.equal(1);
      });
    });

    describe('option: priority', () => {
      it('applies correct ARIA attributes based on priority', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return (
            <React.Fragment>
              <button onClick={() => add({ title: 'high priority', priority: 'high' })}>
                add high
              </button>
              <button onClick={() => add({ title: 'low priority', priority: 'low' })}>
                add low
              </button>
            </React.Fragment>
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

        const highPriorityButton = screen.getByRole('button', { name: 'add high' });
        fireEvent.click(highPriorityButton);

        const highRoot = screen.getByTestId('root');

        expect(highRoot.getAttribute('role')).to.equal('alertdialog');
        expect(highRoot.getAttribute('aria-modal')).to.equal('false');
        expect(screen.getByRole('alert')).to.not.equal(null);
        expect(screen.getByRole('alert').getAttribute('aria-atomic')).to.equal('true');

        const closeHighButton = screen.getByRole('button', { name: 'close-press' });
        fireEvent.click(closeHighButton);

        const lowPriorityButton = screen.getByRole('button', { name: 'add low' });
        fireEvent.click(lowPriorityButton);

        const lowRoot = screen.getByTestId('root');

        expect(lowRoot.getAttribute('role')).to.equal('dialog');
        expect(lowRoot.getAttribute('aria-modal')).to.equal('false');
        expect(screen.getByRole('status')).to.not.equal(null);
        expect(screen.getByRole('status').getAttribute('aria-live')).to.equal('polite');
      });
    });
  });

  describe('promise', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToastManager();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Title data-testid="title">{t.title}</Toast.Title>
          <Toast.Description data-testid="description">{t.description}</Toast.Description>
          <span>{t.type}</span>
        </Toast.Root>
      ));
    }

    it('displays success state as description after promise resolves', async () => {
      function AddButton() {
        const { promise } = useToastManager();
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

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('success');
    });

    it('displays error state as description after promise rejects', async () => {
      function AddButton() {
        const { promise } = useToastManager();
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

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('error');
    });

    it('passes data when success is a function', async () => {
      function AddButton() {
        const { promise } = useToastManager();
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

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('test success');
    });

    it('passes data when error is a function', async () => {
      function AddButton() {
        const { promise } = useToastManager();
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

      expect(screen.getByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('test error');
    });

    it('supports custom options', async () => {
      function AddButton() {
        const { promise } = useToastManager();
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
      const { toasts } = useToastManager();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Title data-testid="title">{t.title}</Toast.Title>
        </Toast.Root>
      ));
    }

    it('updates the toast', async () => {
      function AddButton() {
        const { add, update } = useToastManager();
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

  describe('close', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function CustomList() {
      const { toasts } = useToastManager();
      return toasts.map((t) => (
        <Toast.Root key={t.id} toast={t} data-testid="root">
          <Toast.Title data-testid="title">{t.title}</Toast.Title>
        </Toast.Root>
      ));
    }

    it('closes a toast', async () => {
      function AddButton() {
        const { add, close } = useToastManager();
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
                  close(idRef.current);
                }
              }}
            >
              close
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

      const closeButton = screen.getByRole('button', { name: 'close' });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('root')).to.equal(null);
    });
  });
});
