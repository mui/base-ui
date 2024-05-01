import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import clsx from 'clsx';
import classes from './dialog.module.css';

export default function DialogExperiment() {
  const [open, setOpen] = React.useState(false);
  const [modal, setModal] = React.useState(false);

  function setState(shouldOpen: boolean, shouldBeModal?: boolean) {
    return () => {
      setOpen(shouldOpen);
      if (shouldBeModal !== undefined) {
        setModal(shouldBeModal);
      }
    };
  }

  return (
    <div className={classes.page}>
      <button type="button" className={classes.button} onClick={setState(true, false)}>
        Open non-modal
      </button>
      <button type="button" className={classes.button} onClick={setState(true, true)}>
        Open modal
      </button>
      <Dialog.Root
        open={open}
        modal={modal}
        onOpenChange={setState(false)}
        className={clsx(classes.dialog, modal ? classes.modal : classes.nonmodal)}
      >
        <h1>Dialog</h1>
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
      </Dialog.Root>
    </div>
  );
}
