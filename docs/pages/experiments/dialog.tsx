import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import classes from './dialog.module.css';

interface DemoProps {
  modal: boolean;
  softClose: boolean;
}

function renderContent(title: string, includeNested: number) {
  return (
    <React.Fragment>
      <Dialog.Title className={classes.title}>{title}</Dialog.Title>
      <Dialog.Description>This is a sample dialog.</Dialog.Description>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget sapien id dolor rutrum
        porta. Sed enim nulla, placerat eu tincidunt non, ultrices in lectus. Curabitur pellentesque
        diam nec ligula hendrerit dapibus.
      </p>

      <div className={classes.form}>
        <textarea placeholder="Testing focus" />
        <input type="text" placeholder="Testing focus" />
        <input type="text" placeholder="Testing focus" />
      </div>

      <div className={classes.controls}>
        {includeNested > 0 ? (
          <Dialog.Root>
            <Dialog.Trigger>
              <button type="button" className={classes.button}>
                Open nested
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className={classes.backdrop} />
              <Dialog.Popup className={classes.dialog}>
                {renderContent('Nested dialog', includeNested - 1)}
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}

        <Dialog.Close className={classes.button}>Close</Dialog.Close>
      </div>
    </React.Fragment>
  );
}

function UncontrolledDialogDemo(props: DemoProps) {
  const { modal, softClose } = props;

  return (
    <span className={classes.demo}>
      <Dialog.Root modal={modal} softClose={softClose}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open uncontrolled
          </button>
        </Dialog.Trigger>
        {modal && <Dialog.Backdrop className={classes.backdrop} />}
        <Dialog.Popup className={classes.dialog}>
          {renderContent(`Uncontrolled ${modal ? 'modal' : 'nonmodal'} dialog`, 2)}
        </Dialog.Popup>
      </Dialog.Root>
    </span>
  );
}

function ControlledDialogDemo(props: DemoProps) {
  const [open, setOpen] = React.useState(false);
  const { modal, softClose } = props;

  return (
    <span className={classes.demo}>
      <button type="button" className={classes.button} onClick={() => setOpen(true)}>
        Open controlled
      </button>

      <Dialog.Root open={open} modal={modal} onOpenChange={setOpen} softClose={softClose}>
        {modal && <Dialog.Backdrop className={classes.backdrop} />}
        <Dialog.Popup className={classes.dialog}>
          {renderContent(`Controlled ${modal ? 'modal' : 'nonmodal'} dialog`, 2)}
        </Dialog.Popup>
      </Dialog.Root>
    </span>
  );
}

export default function DialogExperiment() {
  const [modal, setModal] = React.useState(false);
  const [softClose, setSoftClose] = React.useState(false);

  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
      <UncontrolledDialogDemo modal={modal} softClose={softClose} />
      <ControlledDialogDemo modal={modal} softClose={softClose} />
      <h2>Options</h2>
      <label>
        <input
          type="checkbox"
          checked={modal}
          onChange={(event) => setModal(event.target.checked)}
        />{' '}
        Modal
      </label>
      <label>
        <input
          type="checkbox"
          checked={softClose}
          onChange={(event) => setSoftClose(event.target.checked)}
        />{' '}
        Soft-close
      </label>
    </div>
  );
}
