import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer } from '#test-utils';
import { List } from './utils/test-utils';

describe('Manager', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  describe('add', () => {
    it('adds a toast', async () => {
      const toastManager = Toast.createToastManager();

      function add() {
        toastManager.add({
          title: 'title',
        });
      }

      function AddButton() {
        return (
          <button type="button" onClick={add}>
            add
          </button>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      expect(screen.queryByTestId('title')).to.equal(null);

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      expect(screen.queryByTestId('title')).not.to.equal(null);

      await clock.tickAsync(5000);

      expect(screen.queryByTestId('title')).to.equal(null);
    });

    it('returns a toast id', async () => {
      const toastManager = Toast.createToastManager();

      const toastId = toastManager.add({
        title: 'title',
      });

      expect(toastId).to.be.a('string');
    });
  });

  describe('promise', () => {
    it('adds a toast with the loading state that is updated with the success state', async () => {
      const toastManager = Toast.createToastManager();

      function add() {
        toastManager.promise(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve('success');
            }, 1000);
          }),
          {
            loading: 'loading',
            success: 'success',
            error: 'error',
          },
        );
      }

      function AddButton() {
        return (
          <button type="button" onClick={add}>
            add
          </button>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);
      await flushMicrotasks();

      expect(screen.queryByTestId('description')).to.have.text('loading');

      await clock.tickAsync(1000);

      expect(screen.queryByTestId('description')).to.have.text('success');
    });

    it('does not inherit a loading timeout when success does not specify one', async () => {
      const toastManager = Toast.createToastManager();

      function add() {
        toastManager.promise(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve('success');
            }, 1000);
          }),
          {
            loading: {
              description: 'loading',
              timeout: 0,
            },
            success: {
              description: 'success',
            },
            error: 'error',
          },
        );
      }

      function AddButton() {
        return (
          <button type="button" onClick={add}>
            add
          </button>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      await flushMicrotasks();

      expect(screen.queryByTestId('description')).to.have.text('loading');

      await clock.tickAsync(1000);

      expect(screen.queryByTestId('description')).to.have.text('success');

      await clock.tickAsync(5000);

      expect(screen.queryByTestId('description')).to.equal(null);
    });

    it('adds a toast with the loading state that is updated with the error state', async () => {
      const toastManager = Toast.createToastManager();

      function promise() {
        toastManager
          .promise(
            new Promise((res, rej) => {
              rej(new Error('error'));
            }),
            {
              loading: 'loading',
              success: 'success',
              error: 'error',
            },
          )
          .catch(() => {
            // Swallow the error
          });
      }

      function AddButton() {
        return (
          <button type="button" onClick={promise}>
            add
          </button>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <AddButton />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);
      await flushMicrotasks();

      expect(screen.getByTestId('description')).to.have.text('error');
    });
  });

  describe('update', () => {
    it('updates a toast', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'title',
        });
      }

      function update() {
        toastManager.update(toastId, {
          title: 'updated',
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={update}>
              update method
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      const updateButton = screen.getByRole('button', { name: 'update method' });
      fireEvent.click(updateButton);

      expect(screen.getByTestId('title')).to.have.text('updated');
    });

    it('resets the auto-dismiss timer when updating with the same timeout value', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'title',
          timeout: 1000,
        });
      }

      function resetTimeout() {
        toastManager.update(toastId, {
          timeout: 1000,
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={resetTimeout}>
              reset timeout
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.queryByTestId('title')).not.to.equal(null);

      await clock.tickAsync(900);
      expect(screen.queryByTestId('title')).not.to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'reset timeout' }));

      await clock.tickAsync(200);
      expect(screen.queryByTestId('title')).not.to.equal(null);

      await clock.tickAsync(800);
      expect(screen.queryByTestId('title')).to.equal(null);
    });

    it('resets the auto-dismiss timer when updating from 0 to a timeout, then updating with the same timeout again', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'title',
          timeout: 0,
        });
      }

      function setTimeoutTo1000() {
        toastManager.update(toastId, {
          timeout: 1000,
        });
      }

      function resetTimeoutTo1000() {
        toastManager.update(toastId, {
          timeout: 1000,
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={setTimeoutTo1000}>
              set timeout
            </button>
            <button type="button" onClick={resetTimeoutTo1000}>
              reset timeout
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.queryByTestId('title')).not.to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'set timeout' }));

      await clock.tickAsync(900);
      expect(screen.queryByTestId('title')).not.to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'reset timeout' }));

      await clock.tickAsync(200);
      expect(screen.queryByTestId('title')).not.to.equal(null);

      await clock.tickAsync(800);
      expect(screen.queryByTestId('title')).to.equal(null);
    });

    it('auto-dismisses when updating timeout from 0 to a positive value', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'title',
          timeout: 0,
        });
      }

      function update() {
        toastManager.update(toastId, {
          timeout: 1000,
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={update}>
              update method
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.queryByTestId('title')).not.to.equal(null);

      fireEvent.click(screen.getByRole('button', { name: 'update method' }));
      await clock.tickAsync(1000);

      expect(screen.queryByTestId('title')).to.equal(null);
    });

    it('schedules a timer when updating a loading toast to a non-loading type', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'loading',
          type: 'loading',
        });
      }

      function update() {
        toastManager.update(toastId, {
          title: 'success',
          type: 'success',
          timeout: 1000,
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={update}>
              update method
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.getByTestId('title')).to.have.text('loading');

      fireEvent.click(screen.getByRole('button', { name: 'update method' }));
      expect(screen.getByTestId('title')).to.have.text('success');

      await clock.tickAsync(1000);

      expect(screen.queryByTestId('title')).to.equal(null);
    });

    it('does not clear the auto-dismiss timer when updated twice before a re-render', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'loading',
          type: 'loading',
        });
      }

      function doubleUpdate() {
        toastManager.update(toastId, {
          type: 'success',
          timeout: 1000,
        });

        toastManager.update(toastId, {
          title: 'new',
        });
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={doubleUpdate}>
              double update
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'add' }));
      expect(screen.getByTestId('title')).to.have.text('loading');

      fireEvent.click(screen.getByRole('button', { name: 'double update' }));
      expect(screen.getByTestId('title')).to.have.text('new');

      await clock.tickAsync(1000);

      expect(screen.queryByTestId('title')).to.equal(null);
    });
  });

  describe('close', () => {
    it('closes a toast', async () => {
      const toastManager = Toast.createToastManager();

      let toastId: string;

      function add() {
        toastId = toastManager.add({
          title: 'title',
        });
      }

      function close() {
        toastManager.close(toastId);
      }

      function Buttons() {
        return (
          <React.Fragment>
            <button type="button" onClick={add}>
              add
            </button>
            <button type="button" onClick={close}>
              close
            </button>
          </React.Fragment>
        );
      }

      await render(
        <Toast.Provider toastManager={toastManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Buttons />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button);

      const closeButton = screen.getByRole('button', { name: 'close' });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('title')).to.equal(null);
    });
  });
});
