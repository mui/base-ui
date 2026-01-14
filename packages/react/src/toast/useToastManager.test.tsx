import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { Dialog } from '@base-ui/react/dialog';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';
import { useToastManager } from './useToastManager';
import { List } from './utils/test-utils';

async function tick(clock: ReturnType<typeof createRenderer>['clock'], ms: number) {
  clock.tick(ms);
  await flushMicrotasks();
}

describe.skipIf(!isJSDOM)('useToast', () => {
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

      await tick(clock, 5000);

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

        await tick(clock, 1000);

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

        await tick(clock, 1000);

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
      it('applies correct ARIA attributes for high priority toasts', async () => {
        function AddButton() {
          const { add } = useToastManager();
          return (
            <button onClick={() => add({ title: 'high priority', priority: 'high' })}>
              add high
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

        const highPriorityButton = screen.getByRole('button', { name: 'add high' });
        fireEvent.click(highPriorityButton);

        const highRoot = screen.getByTestId('root');

        expect(highRoot.getAttribute('role')).to.equal('alertdialog');
        expect(highRoot.getAttribute('aria-modal')).to.equal('false');
        expect(screen.getByRole('alert')).not.to.equal(null);
        expect(screen.getByRole('alert').getAttribute('aria-atomic')).to.equal('true');

        const closeHighButton = screen.getByLabelText('close-press');
        fireEvent.click(closeHighButton);

        expect(screen.queryByRole('alert')).to.equal(null);
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

      await tick(clock, 1000);

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

      await tick(clock, 1000);

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

      await tick(clock, 1000);

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

      await tick(clock, 1000);

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

    describe('timeout handling', () => {
      it('auto-dismisses success toast after default timeout when promise resolves', async () => {
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 5000);

        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('auto-dismisses error toast after default timeout when promise rejects', async () => {
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('error');

        await tick(clock, 5000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('uses custom timeout from success options when promise resolves', async () => {
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
                    success: {
                      description: 'success',
                      timeout: 2000,
                    },
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 1000);
        expect(screen.getByTestId('root')).not.to.equal(null);

        await tick(clock, 1000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('uses custom timeout from error options when promise rejects', async () => {
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
                    error: {
                      description: 'error',
                      timeout: 3000,
                    },
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('error');

        await tick(clock, 2000);
        expect(screen.getByTestId('root')).not.to.equal(null);

        await tick(clock, 1000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('uses provider timeout when no custom timeout is specified', async () => {
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
          <Toast.Provider timeout={1000}>
            <Toast.Viewport>
              <CustomList />
            </Toast.Viewport>
            <AddButton />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 1000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('does not inherit a loading timeout when success does not specify one', async () => {
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
                    loading: {
                      description: 'loading',
                      timeout: 0,
                    },
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

        fireEvent.click(screen.getByRole('button', { name: 'add' }));
        expect(screen.getByTestId('description')).to.have.text('loading');

        await tick(clock, 1000);
        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 5000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });

      it('does not auto-dismiss when timeout is set to 0', async () => {
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
                    success: {
                      description: 'success',
                      timeout: 0,
                    },
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 10000);
        expect(screen.getByTestId('root')).not.to.equal(null);
      });

      it('pauses timers when hovering over toast', async () => {
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
                    success: {
                      description: 'success',
                      timeout: 3000,
                    },
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

        await tick(clock, 1000);

        expect(screen.getByTestId('description')).to.have.text('success');

        await tick(clock, 1000);

        const toast = screen.getByTestId('root');
        fireEvent.mouseEnter(toast);

        await tick(clock, 5000);
        expect(screen.getByTestId('root')).not.to.equal(null);

        fireEvent.mouseLeave(toast);
        await tick(clock, 2000);
        expect(screen.queryByTestId('root')).to.equal(null);
      });
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

    it('auto-dismisses when timeout changes from 0 to a positive value', async () => {
      function AddButton() {
        const { add, update } = useToastManager();
        const idRef = React.useRef<string | null>(null);
        return (
          <React.Fragment>
            <button
              type="button"
              onClick={() => {
                idRef.current = add({ title: 'test', timeout: 0 });
              }}
            >
              add
            </button>
            <button
              type="button"
              onClick={() => {
                if (idRef.current) {
                  update(idRef.current, { timeout: 1000 });
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

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.queryByTestId('root')).not.to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'update' }));
      await tick(clock, 1000);

      expect(screen.queryByTestId('root')).to.equal(null);
    });

    it('schedules a timer when updating a loading toast to a non-loading type', async () => {
      function AddButton() {
        const { add, update } = useToastManager();
        const idRef = React.useRef<string | null>(null);
        return (
          <React.Fragment>
            <button
              type="button"
              onClick={() => {
                idRef.current = add({ title: 'loading', type: 'loading' });
              }}
            >
              add
            </button>
            <button
              type="button"
              onClick={() => {
                if (idRef.current) {
                  update(idRef.current, { title: 'success', type: 'success', timeout: 1000 });
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

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.getByTestId('title')).to.have.text('loading');

      fireEvent.click(screen.getByRole('button', { name: 'update' }));
      expect(screen.getByTestId('title')).to.have.text('success');

      await tick(clock, 1000);
      expect(screen.queryByTestId('root')).to.equal(null);
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

  describe('prop: limit', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function TestList() {
      const [count, setCount] = React.useState(0);
      const { toasts, add } = useToastManager();
      return (
        <React.Fragment>
          {toasts.map((t) => (
            <Toast.Root key={t.id} toast={t} data-testid={t.title}>
              <Toast.Close data-testid={`close-${t.title}`} />
            </Toast.Root>
          ))}
          <button
            onClick={() => {
              const nextCount = count + 1;
              setCount(nextCount);
              add({ title: `toast-${nextCount}` });
            }}
          >
            add
          </button>
        </React.Fragment>
      );
    }

    it('marks toasts as limited when the limit is exceeded', async () => {
      await render(
        <Toast.Provider limit={2}>
          <Toast.Viewport>
            <TestList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const addButton = screen.getByRole('button', { name: 'add' });

      fireEvent.click(addButton);
      const toast1 = screen.getByTestId('toast-1');
      expect(toast1).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast2 = screen.getByTestId('toast-2');
      expect(toast2).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast3 = screen.getByTestId('toast-3');
      expect(toast3).not.to.have.attribute('data-limited');
      expect(toast1).to.have.attribute('data-limited');
    });

    it('unmarks toasts as limited when the limit is not exceeded', async () => {
      await render(
        <Toast.Provider limit={2}>
          <Toast.Viewport>
            <TestList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const addButton = screen.getByRole('button', { name: 'add' });

      fireEvent.click(addButton);
      const toast1 = screen.getByTestId('toast-1');
      expect(toast1).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast2 = screen.getByTestId('toast-2');
      expect(toast2).not.to.have.attribute('data-limited');

      fireEvent.click(addButton);
      const toast3 = screen.getByTestId('toast-3');
      expect(toast3).not.to.have.attribute('data-limited');

      const closeToast3 = screen.getByTestId('close-toast-3');
      fireEvent.click(closeToast3);

      expect(toast1).not.to.have.attribute('data-limited');
    });
  });

  describe('in dialog', () => {
    const { clock, render } = createRenderer();

    clock.withFakeTimers();

    function DialogToastExample() {
      const { add } = useToastManager();
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <React.Fragment>
          <button onClick={() => setIsOpen(true)}>open dialog</button>
          <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button
                  onClick={() =>
                    add({
                      title: 'Toast in dialog',
                      description: 'This toast is in a dialog',
                    })
                  }
                >
                  add
                </button>
                <Dialog.Close />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>
      );
    }

    function ToastInDialogList() {
      const { toasts } = useToastManager();
      return toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast} data-testid="toast-root">
          <Toast.Title data-testid="toast-title">{toast.title}</Toast.Title>
          <Toast.Description data-testid="toast-description">{toast.description}</Toast.Description>
          <Toast.Close data-testid="toast-close" aria-label="close" />
        </Toast.Root>
      ));
    }

    it('toasts in dialogs are accessible and not aria-hidden', async () => {
      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <ToastInDialogList />
          </Toast.Viewport>
          <DialogToastExample />
        </Toast.Provider>,
      );

      const openDialogButton = screen.getByRole('button', { name: 'open dialog' });
      fireEvent.click(openDialogButton);

      expect(screen.getByRole('dialog')).not.to.equal(null);

      const addToastButton = screen.getByRole('button', { name: 'add' });
      fireEvent.click(addToastButton);

      const toastRoot = screen.getByTestId('toast-root');
      expect(toastRoot).not.to.equal(null);
      expect(screen.getByTestId('toast-title')).to.have.text('Toast in dialog');
      expect(screen.getByTestId('toast-description')).to.have.text('This toast is in a dialog');
    });

    it('high priority toasts in dialogs have correct accessibility structure', async () => {
      function HighPriorityToastInDialog() {
        const { add } = useToastManager();
        return (
          <Dialog.Root open>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button
                  onClick={() => {
                    add({
                      title: 'High priority toast',
                      description: 'This is urgent',
                      priority: 'high',
                    });
                  }}
                >
                  add
                </button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      await render(
        <Toast.Provider>
          <Toast.Viewport>
            <ToastInDialogList />
          </Toast.Viewport>
          <HighPriorityToastInDialog />
        </Toast.Provider>,
      );

      const addToastButton = screen.getByRole('button', { name: 'add' });
      fireEvent.click(addToastButton);

      const toastRoot = screen.getByTestId('toast-root');
      expect(toastRoot).to.have.attribute('aria-hidden', 'true');
      expect(screen.queryByRole('alert')).not.to.equal(null);
    });
  });
});
