'use client';
import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import styles from '../../../(public)/(content)/react/components/tabs/demos/hero/css-modules/index.module.css';
import { OverviewIcon, ProjectIcon, PersonIcon } from './_icons';
import motionStyles from './motion.module.css';

const DURATION = 1; // seconds

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

const MotionTab = React.forwardRef(function MotionTab(
  props: Tabs.Tab.Props & {
    selectedValue: Tabs.Tab.Props['value'];
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { value, selectedValue, style, children, ...otherProps } = props;
  return (
    <Tabs.Tab
      ref={forwardedRef}
      value={value}
      style={{
        ...style,
        position: 'relative',
      }}
      {...otherProps}
    >
      {children}
      {value === selectedValue ? (
        <Tabs.Indicator
          className={motionStyles.Indicator}
          render={
            <motion.div
              layoutId="indicator"
              id="indicator"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{
                layout: { duration: DURATION },
              }}
            />
          }
        />
      ) : null}
    </Tabs.Tab>
  );
});

export default function ExampleTabs() {
  const [value, setValue] = React.useState('overview');
  return (
    <Tabs.Root className={styles.Tabs} value={value} onValueChange={setValue}>
      <Tabs.List className={styles.List}>
        <MotionTab className={styles.Tab} value="overview" selectedValue={value}>
          Overview
        </MotionTab>
        <MotionTab className={styles.Tab} value="projects" selectedValue={value}>
          Projects
        </MotionTab>
        <MotionTab className={styles.Tab} value="account" selectedValue={value}>
          Account
        </MotionTab>
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
