import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import { CssTransition, CssAnimation } from '@base_ui/react/Transitions';
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

      <textarea />
      <input type="text" name="username" />
      <input type="password" name="password" />

      <Dialog.Close className={classes.button}>Close</Dialog.Close>
    </React.Fragment>
  );
}

function CssTransitionDialogDemo() {
  return (
    <span className={classes.demo}>
      <Dialog.Root softClose>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open with CSS transition
          </button>
        </Dialog.Trigger>

        <CssTransition lastTransitionedPropertyOnExit="backdrop-filter">
          <Dialog.Backdrop className={`${classes.backdrop} ${classes.withTransitions}`} />
        </CssTransition>

        <CssTransition>
          <Dialog.Popup className={`${classes.dialog} ${classes.withTransitions}`}>
            {renderContent('Dialog with CSS transitions')}
          </Dialog.Popup>
        </CssTransition>
      </Dialog.Root>
    </span>
  );
}

function CssAnimationDialogDemo() {
  return (
    <span className={classes.demo}>
      <Dialog.Root softClose>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open with CSS animation
          </button>
        </Dialog.Trigger>

        <CssAnimation>
          <Dialog.Backdrop className={`${classes.backdrop} ${classes.withAnimations}`} />
        </CssAnimation>

        <CssAnimation>
          <Dialog.Popup className={`${classes.dialog} ${classes.withAnimations}`}>
            {renderContent('Dialog with CSS animations')}
          </Dialog.Popup>
        </CssAnimation>
      </Dialog.Root>
    </span>
  );
}

export default function DialogExperiment() {
  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
      <CssTransitionDialogDemo />
      <CssAnimationDialogDemo />
    </div>
  );
}
