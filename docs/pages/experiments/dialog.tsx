import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import classes from './dialog.module.css';

function renderContent(title: string) {
  return (
    <React.Fragment>
      <Dialog.Title className={classes.title}>{title}</Dialog.Title>
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

function UncontrolledDialogDemo(props) {
  const { modal, closeOnClickOutside } = props;

  return (
    <div>
      <Dialog.Root modal={modal} closeOnClickOutside={closeOnClickOutside}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open
          </button>
        </Dialog.Trigger>
        {modal && <Dialog.Backdrop className={classes.backdrop} />}
        <Dialog.Popup className={classes.dialog}>
          {renderContent(`Uncontrolled ${modal ? 'modal' : 'nonmodal'} dialog`)}
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

function ControlledDialogDemo(props) {
  const [open, setOpen] = React.useState(false);
  const { modal, closeOnClickOutside } = props;

  return (
    <div>
      <button type="button" className={classes.button} onClick={() => setOpen(true)}>
        Open
      </button>

      <Dialog.Root
        open={open}
        modal={modal}
        onOpenChange={setOpen}
        closeOnClickOutside={closeOnClickOutside}
      >
        {modal && <Dialog.Backdrop className={classes.backdrop} />}
        <Dialog.Popup className={classes.dialog}>
          {renderContent(`Controlled ${modal ? 'modal' : 'nonmodal'} dialog`)}
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

export default function DialogExperiment() {
  const [modal, setModal] = React.useState(false);
  const [closeOnClickOutside, setCloseOnClickOutside] = React.useState(false);

  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
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
          checked={closeOnClickOutside}
          onChange={(event) => setCloseOnClickOutside(event.target.checked)}
        />{' '}
        Soft-close
      </label>
      <h2>Uncontrolled</h2>
      <UncontrolledDialogDemo modal={modal} closeOnClickOutside={closeOnClickOutside} />
      <h2>Controlled</h2>
      <ControlledDialogDemo modal={modal} closeOnClickOutside={closeOnClickOutside} />
    </div>
  );
}
