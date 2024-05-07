import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import classes from './dialog.module.css';

interface DemoProps {
  modal: boolean;
  closeOnClickOutside: boolean;
}

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

      <textarea />
      <input type="text" name="username" />
      <input type="password" name="password" />

      <Dialog.Close className={classes.button}>Close</Dialog.Close>
    </React.Fragment>
  );
}

function logRef(element: HTMLElement | null) {
  console.log('component:', element);
}

function logInnerRef(element: HTMLElement | null) {
  console.log('rendered element:', element);
}

function UncontrolledDialogDemo(props: DemoProps) {
  const { modal, closeOnClickOutside } = props;

  return (
    <span className={classes.demo}>
      <Dialog.Root modal={modal} closeOnClickOutside={closeOnClickOutside} render={<div />}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open uncontrolled
          </button>
        </Dialog.Trigger>
        {modal && <Dialog.Backdrop className={classes.backdrop} />}
        <Dialog.Popup className={classes.dialog} ref={logRef} render={<div ref={logInnerRef} />}>
          {renderContent(`Uncontrolled ${modal ? 'modal' : 'nonmodal'} dialog`)}
        </Dialog.Popup>
      </Dialog.Root>
    </span>
  );
}

function ControlledDialogDemo(props: DemoProps) {
  const [open, setOpen] = React.useState(false);
  const { modal, closeOnClickOutside } = props;

  return null;

  return (
    <span className={classes.demo}>
      <button type="button" className={classes.button} onClick={() => setOpen(true)}>
        Open controlled
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
    </span>
  );
}

export default function DialogExperiment() {
  const [modal, setModal] = React.useState(false);
  const [closeOnClickOutside, setCloseOnClickOutside] = React.useState(false);

  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
      <UncontrolledDialogDemo modal={modal} closeOnClickOutside={closeOnClickOutside} />
      <ControlledDialogDemo modal={modal} closeOnClickOutside={closeOnClickOutside} />
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
    </div>
  );
}
