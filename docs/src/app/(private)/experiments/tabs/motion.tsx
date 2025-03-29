'use client';
import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import styles from '../../../(public)/(content)/react/components/tabs/demos/hero/css-modules/index.module.css';
import { OverviewIcon, ProjectIcon, PersonIcon } from './_icons';

const DURATION = 0.6; // seconds

const MotionTabPanel = React.forwardRef(function MotionTabPanel(
  props: Tabs.Panel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, value, ...otherProps } = props;
  return (
    <Tabs.Panel
      ref={forwardedRef}
      key={value}
      value={value}
      keepMounted
      // workaround tailwind v4 reset applying `display: none !important` on [hidden]
      // it needs to remain visible while the exit animation is still running
      hidden={undefined}
      {...otherProps}
      render={(renderProps, state) => {
        const direction = state.tabActivationDirection === 'right' ? -1 : 1;
        return (
          <motion.div
            {...(renderProps as HTMLMotionProps<'div'>)}
            initial={{
              opacity: 0,
              x: -100 * direction,
            }}
            animate={{
              zIndex: 1,
              opacity: 1,
              x: 0,
              transition: { duration: DURATION },
            }}
            exit={{
              zIndex: 0,
              opacity: 0,
              x: 100 * direction,
              transition: { duration: DURATION },
            }}
          />
        );
      }}
    >
      {children}
    </Tabs.Panel>
  );
});

export default function ExampleTabs() {
  const [value, setValue] = React.useState('overview');
  return (
    <Tabs.Root className={styles.Tabs} value={value} onValueChange={setValue}>
      <Tabs.List className={styles.List}>
        <Tabs.Tab className={styles.Tab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator
          className={styles.Indicator}
          style={{ transitionProperty: 'none !important' }}
        />
      </Tabs.List>

      <AnimatePresence mode="wait">
        {value === 'overview' && (
          <MotionTabPanel key="overview" value="overview" className={styles.Panel}>
            <OverviewIcon className={styles.Icon} />
          </MotionTabPanel>
        )}

        {value === 'projects' && (
          <MotionTabPanel key="projects" value="projects" className={styles.Panel}>
            <ProjectIcon className={styles.Icon} />
          </MotionTabPanel>
        )}

        {value === 'account' && (
          <MotionTabPanel key="account" value="account" className={styles.Panel}>
            <PersonIcon className={styles.Icon} />
          </MotionTabPanel>
        )}
      </AnimatePresence>
    </Tabs.Root>
  );
}
