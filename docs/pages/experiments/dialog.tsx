import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import clsx from 'clsx';
import classes from './dialog.module.css';

function UncontrolledDialogDemo() {
  return (
    <div>
      <Dialog.Root>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open
          </button>
        </Dialog.Trigger>
        <Dialog.Popup className={classes.dialog}>
          <Dialog.Title className={classes.title}>Dialog</Dialog.Title>
          <Dialog.Description>This is a sample dialog</Dialog.Description>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget sapien id dolor rutrum
            porta. Sed enim nulla, placerat eu tincidunt non, ultrices in lectus. Curabitur
            pellentesque diam nec ligula hendrerit dapibus.
          </p>

          <form method="dialog" className={classes.form}>
            <button type="submit" className={classes.button}>
              Submit
            </button>
            <Dialog.Close className={classes.button}>Cancel</Dialog.Close>
          </form>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

function ControlledDialogDemo() {
  const [open, setOpen] = React.useState(false);
  const [modal, setModal] = React.useState(true);

  function setState(shouldOpen: boolean, shouldBeModal?: boolean) {
    return () => {
      setOpen(shouldOpen);
      if (shouldBeModal !== undefined) {
        setModal(shouldBeModal);
      }
    };
  }

  return (
    <div>
      <button type="button" className={classes.button} onClick={setState(true, false)}>
        Open non-modal
      </button>
      <button type="button" className={classes.button} onClick={setState(true, true)}>
        Open modal
      </button>
      <Dialog.Root open={open} modal={modal} onOpenChange={setState(false)}>
        <Dialog.Popup className={clsx(classes.dialog, modal ? classes.modal : classes.nonmodal)}>
          <Dialog.Title className={classes.title}>Dialog</Dialog.Title>
          <Dialog.Description>This is a sample dialog</Dialog.Description>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget sapien id dolor rutrum
            porta. Sed enim nulla, placerat eu tincidunt non, ultrices in lectus. Curabitur
            pellentesque diam nec ligula hendrerit dapibus.
          </p>

          <form method="dialog" className={classes.form}>
            <button type="submit" className={classes.button}>
              Submit
            </button>
            <button type="button" className={classes.button} onClick={setState(false)}>
              Cancel
            </button>
          </form>
        </Dialog.Popup>
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
