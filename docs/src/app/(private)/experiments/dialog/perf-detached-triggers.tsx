/* eslint-disable react/no-unused-prop-types */
'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import classes from './perf.module.css';

type DialogPayload<T> = {
  payload: T;
};

const items = Array.from({ length: 200 }, (_, i) => `Item ${i + 1}`);

export default function DialogDetachedTriggers() {
  return (
    <Dialog.Provider>
      <h1>Detached Dialog Triggers</h1>
      <ul className={classes.list}>
        {items.map((item) => (
          <li key={item} className={classes.listItem}>
            <span>{item}</span>
            <span className={classes.actions}>
              <Dialog.DetachedTrigger
                target="edit-item-dialog"
                payload={item}
                className={classes.action}
              >
                <EditIcon />
              </Dialog.DetachedTrigger>
              <Dialog.DetachedTrigger
                target="delete-item-dialog"
                payload={item}
                className={classes.action}
              >
                <DeleteIcon />
              </Dialog.DetachedTrigger>
            </span>
          </li>
        ))}
      </ul>

      <Dialog.Root id="edit-item-dialog">
        {({ payload }: DialogPayload<string>) => <EditForm item={payload} />}
      </Dialog.Root>
      <Dialog.Root id="delete-item-dialog">
        {({ payload }: DialogPayload<string>) => <DeleteForm item={payload} />}
      </Dialog.Root>
    </Dialog.Provider>
  );
}

function EditForm({ item }: { item: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Popup className={classes.dialog}>
        <Dialog.Title className={classes.title}>Edit {item}</Dialog.Title>
        {item ? (
          <React.Fragment>
            <input type="text" className={classes.input} defaultValue={item} />
            <div className={classes.controls}>
              <Dialog.Close className={classes.button}>Save</Dialog.Close>
              <Dialog.Close className={classes.button}>Cancel</Dialog.Close>
            </div>
          </React.Fragment>
        ) : (
          'No item'
        )}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function DeleteForm({ item }: { item: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Popup className={classes.dialog}>
        <Dialog.Title className={classes.title}>Delete {item}</Dialog.Title>
        {item ? (
          <React.Fragment>
            <p>Are you sure you want to delete {item}?</p>
            <div className={classes.controls}>
              <Dialog.Close className={classes.button}>Yes</Dialog.Close>
              <Dialog.Close className={classes.button}>No</Dialog.Close>
            </div>
          </React.Fragment>
        ) : (
          'No payload'
        )}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
