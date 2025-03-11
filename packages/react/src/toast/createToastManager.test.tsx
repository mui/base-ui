import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
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

      clock.tick(5000);

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
            add method
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

      const button = screen.getByRole('button', { name: 'add method' });
      fireEvent.click(button);
      await flushMicrotasks();

      expect(screen.queryByTestId('description')).to.have.text('loading');

      clock.tick(1000);
      await flushMicrotasks();

      expect(screen.queryByTestId('description')).to.have.text('success');
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
            add method
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

      const button = screen.getByRole('button', { name: 'add method' });
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
              add method
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

      const button = screen.getByRole('button', { name: 'add method' });
      fireEvent.click(button);

      const updateButton = screen.getByRole('button', { name: 'update method' });
      fireEvent.click(updateButton);

      expect(screen.getByTestId('title')).to.have.text('updated');
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
              add method
            </button>
            <button type="button" onClick={close}>
              close method
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

      const button = screen.getByRole('button', { name: 'add method' });
      fireEvent.click(button);

      const closeButton = screen.getByRole('button', { name: 'close method' });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('title')).to.equal(null);
    });
  });
});
