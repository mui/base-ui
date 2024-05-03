import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import classes from './dialog.module.css';

function renderContent() {
  return (
    <React.Fragment>
      <Dialog.Title className={classes.title}>Dialog</Dialog.Title>
      <Dialog.Description>This is a sample dialog</Dialog.Description>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget sapien id dolor rutrum
        porta. Sed enim nulla, placerat eu tincidunt non, ultrices in lectus. Curabitur pellentesque
        diam nec ligula hendrerit dapibus.
      </p>

      <textarea className={classes.textarea} />
      <input type="text" name="username" />
      <input type="password" name="password" />

      <Dialog.Close className={classes.button}>Close</Dialog.Close>
    </React.Fragment>
  );
}

function UncontrolledDialogDemo() {
  const [modal, setModal] = React.useState(true);

  return (
    <div>
      <Dialog.Root closeOnClickOutside modal={modal}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open
          </button>
        </Dialog.Trigger>
        <label>
          <input
            type="checkbox"
            checked={modal}
            onChange={(event) => setModal(event.target.checked)}
          />{' '}
          Modal
        </label>
        <Dialog.Backdrop className={classes.backdrop} />
        <Dialog.Popup className={classes.dialog}>{renderContent()}</Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

function ControlledDialogDemo() {
  const [open, setOpen] = React.useState(false);
  const [modal, setModal] = React.useState(true);

  return (
    <div>
      <button type="button" className={classes.button} onClick={() => setOpen(true)}>
        Open
      </button>
      <label>
        <input
          type="checkbox"
          checked={modal}
          onChange={(event) => setModal(event.target.checked)}
        />{' '}
        Modal
      </label>
      <Dialog.Root open={open} modal={modal} onOpenChange={setOpen}>
        <Dialog.Backdrop className={classes.backdrop} />
        <Dialog.Popup className={classes.dialog}>{renderContent()}</Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

export default function DialogExperiment() {
  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
      <h2>Uncontrolled</h2>
      <UncontrolledDialogDemo />
      <h2>Controlled</h2>
      <ControlledDialogDemo />
    </div>
  );
}
