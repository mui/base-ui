import * as React from 'react';
import clsx from 'clsx';
import * as Dialog from '@base_ui/react/Dialog';
import { useTransitionStatus } from '@base_ui/react/Transitions';
import { animated as springAnimated, useSpring, useSpringRef } from '@react-spring/web';
import classes from './dialog.module.css';

const NESTED_DIALOGS = 8;

interface DemoProps {
  keepMounted: boolean;
  modal: boolean;
  softClose: boolean;
}

function renderContent(
  title: string,
  includeNested: number,
  nestedClassName: string,
  modal: boolean,
  softClose: boolean,
) {
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
          <Dialog.Root modal={modal} softClose={softClose}>
            <Dialog.Trigger>
              <button type="button" className={classes.button}>
                Open nested
              </button>
            </Dialog.Trigger>

            <Dialog.Backdrop className={clsx(classes.backdrop, nestedClassName)} />
            <Dialog.Popup className={clsx(classes.dialog, nestedClassName)}>
              {renderContent(
                `Nested dialog ${NESTED_DIALOGS + 1 - includeNested}`,
                includeNested - 1,
                nestedClassName,
                modal,
                softClose,
              )}
            </Dialog.Popup>
          </Dialog.Root>
        ) : null}

        <Dialog.Close className={classes.button}>Close</Dialog.Close>
      </div>
    </React.Fragment>
  );
}

function CssTransitionDialogDemo({ keepMounted, modal, softClose }: DemoProps) {
  return (
    <span className={classes.demo}>
      <Dialog.Root modal={modal} softClose={softClose}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open with CSS transition
          </button>
        </Dialog.Trigger>

        <Dialog.Backdrop
          keepMounted={keepMounted}
          className={clsx(classes.backdrop, classes.withTransitions)}
        />

        <Dialog.Popup
          keepMounted={keepMounted}
          className={clsx(classes.dialog, classes.withTransitions)}
        >
          {renderContent(
            'Dialog with CSS transitions',
            NESTED_DIALOGS,
            classes.withTransitions,
            modal,
            softClose,
          )}
        </Dialog.Popup>
      </Dialog.Root>
    </span>
  );
}

function CssAnimationDialogDemo({ keepMounted, modal, softClose }: DemoProps) {
  return (
    <span className={classes.demo}>
      <Dialog.Root modal={modal} softClose={softClose}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open with CSS animation
          </button>
        </Dialog.Trigger>

        <Dialog.Backdrop
          keepMounted={keepMounted}
          className={clsx(classes.backdrop, classes.withAnimations)}
        />

        <Dialog.Popup
          keepMounted={keepMounted}
          className={clsx(classes.dialog, classes.withAnimations)}
        >
          {renderContent(
            'Dialog with CSS animations',
            NESTED_DIALOGS,
            classes.withAnimations,
            modal,
            softClose,
          )}
        </Dialog.Popup>
      </Dialog.Root>
    </span>
  );
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ReactSpringDialogDemo({ animated, keepMounted }: DemoProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <span className={classes.demo}>
      <Dialog.Root softClose open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>
          <button type="button" className={classes.button}>
            Open with React Spring transition
          </button>
        </Dialog.Trigger>

        <Dialog.Backdrop
          animated={animated}
          className={`${classes.backdrop} ${animated && classes.withAnimations}`}
        />

        <ReactSpringTransition open={open}>
          <Dialog.Popup
            animated={false}
            keepMounted={keepMounted}
            className={`${classes.dialog} ${classes.withReactSpringTransition}`}
          >
            {renderContent('Dialog with ReactSpring transitions', 3)}
          </Dialog.Popup>
        </ReactSpringTransition>
      </Dialog.Root>
    </span>
  );
}

function ReactSpringTransition(props: { open: boolean; children?: React.ReactElement }) {
  const { open, children } = props;

  const api = useSpringRef();
  const springs = useSpring({
    ref: api,
    from: { opacity: 0, transform: 'translateY(-8px) scale(0.95)' },
  });

  const { mounted, onTransitionEnded } = useTransitionStatus(open);

  React.useEffect(() => {
    if (open) {
      api.start({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        config: { tension: 250, friction: 10 },
      });
    } else {
      api.start({
        opacity: 0,
        transform: 'translateY(-8px) scale(0.95)',
        config: { tension: 170, friction: 26 },
        onRest: () => onTransitionEnded(),
      });
    }
  }, [api, open, mounted, onTransitionEnded]);

  return mounted ? (
    <springAnimated.div style={springs} className={classes.springWrapper}>
      {children}
    </springAnimated.div>
  ) : null;
}

export default function DialogExperiment() {
  const [keepMounted, setKeepMounted] = React.useState(false);
  const [modal, setModal] = React.useState(true);
  const [softClose, setSoftClose] = React.useState(false);

  return (
    <div className={classes.page}>
      <h1>Dialog</h1>
      <CssTransitionDialogDemo keepMounted={keepMounted} modal={modal} softClose={softClose} />
      <CssAnimationDialogDemo keepMounted={keepMounted} modal={modal} softClose={softClose} />

      <h2>Options</h2>
      <label>
        <input
          type="checkbox"
          checked={keepMounted}
          onChange={(event) => setKeepMounted(event.target.checked)}
        />{' '}
        Keep mounted
      </label>
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
