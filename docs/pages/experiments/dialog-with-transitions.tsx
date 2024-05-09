import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import { CssTransition, CssAnimation } from '@base_ui/react/Transitions';
import { useTransitionStateManager } from '@base_ui/react/useTransition';
import { animated, useSpring, useSpringRef } from '@react-spring/web';
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

        <Dialog.Popup
          keepMounted={false}
          animated
          className={`${classes.dialog} ${classes.withTransitions}`}
        >
          {renderContent('Dialog with CSS transitions')}
        </Dialog.Popup>
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

        <ReactSpringTransition>
          <Dialog.Popup keepMounted={false} className={`${classes.dialog}`}>
            {renderContent('Dialog with CSS animations')}
          </Dialog.Popup>
        </ReactSpringTransition>
      </Dialog.Root>
    </span>
  );
}

function ReactSpringTransition(props: { children?: React.ReactElement }) {
  const { children } = props;
  const { requestedEnter, onExited, transitionStatus } = useTransitionStateManager(true);

  const api = useSpringRef();
  const springs = useSpring({
    ref: api,
    from: { opacity: 0, transform: 'translateY(-8px) scale(0.95)' },
  });

  React.useEffect(() => {
    if (requestedEnter) {
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
        onRest: onExited,
      });
    }
  }, [requestedEnter, api, onExited]);

  console.log(transitionStatus);

  return (
    <animated.div style={springs} className={classes.springWrapper}>
      {children}
    </animated.div>
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
