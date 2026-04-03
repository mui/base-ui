'use client';
import * as React from 'react';
import clsx from 'clsx';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Tabs } from '@base-ui/react/tabs';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { SettingsMetadata, useExperimentSettings } from './_components/SettingsPanel';
import '../../../demo-data/theme/css-modules/theme.css';
import styles from './composite-scroll-ancestors.module.css';

interface Settings {
  activateOnFocus: boolean;
  direction: 'ltr' | 'rtl';
}

const TAB_ITEMS = [
  'Overview',
  'Projects',
  'Account',
  'Usage',
  'Security',
  'Members',
  'Billing',
  'Archive',
  'Analytics',
  'Insights',
  'Automation',
  'Workflows',
  'Notifications',
  'Compliance',
  'Storage',
  'Backups',
  'Integrations',
  'Marketplace',
  'Teams',
  'Invites',
  'Schedules',
  'Reports',
  'Segments',
  'Preferences',
  'Audit Log',
  'Sessions',
  'Tokens',
  'API Access',
  'Domains',
  'Branding',
  'Experiments',
  'Support',
];

const TOOLBAR_ITEMS = [
  'Select',
  'Move',
  'Resize',
  'Inspect',
  'Measure',
  'Comment',
  'History',
  'Export',
  'Duplicate',
  'Align',
  'Distribute',
  'Transform',
  'Annotate',
  'Crop',
  'Mask',
  'Group',
  'Ungroup',
  'Lock',
  'Unlock',
  'Arrange',
  'Palette',
  'Typography',
  'Spacing',
  'Borders',
  'Shadow',
  'Opacity',
  'Blend',
  'Snap',
  'Preview',
  'Present',
  'Publish',
  'Archive',
];

const TOGGLE_ITEMS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

export const settingsMetadata: SettingsMetadata<Settings> = {
  direction: {
    type: 'string',
    label: 'Direction',
    options: ['ltr', 'rtl'],
    default: 'ltr',
  },
  activateOnFocus: {
    type: 'boolean',
    label: 'Tabs activate on focus',
    default: false,
  },
};

export default function CompositeScrollAncestorsExperiment() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <div className={styles.page} dir={settings.direction}>
      <DirectionProvider direction={settings.direction}>
        <header className={styles.header}>
          <h1 className={styles.title}>Composite scroll ancestors</h1>
          <p className={styles.description}>
            These are plain manual checks for the shared composite keyboard scrolling behavior. Use
            the arrow keys plus <kbd>Home</kbd> and <kbd>End</kbd>.
          </p>
        </header>

        <section className={styles.case}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Tabs inside a plain overflow div</h2>
            <p className={styles.caseText}>
              Horizontal list with a native <code>overflow-x: auto</code> container.
            </p>
          </div>
          <div className={styles.scrollerX}>
            <TabsExample activateOnFocus={settings.activateOnFocus} />
          </div>
        </section>

        <section className={styles.case}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Selected tab below the fold on mount</h2>
            <p className={styles.caseText}>
              Reload this page to check whether a preselected vertical tab is scrolled into view
              when it starts below the visible part of a plain overflow container.
            </p>
          </div>
          <div className={styles.scrollerYFrame}>
            <div className={styles.scrollerY}>
              <TabsExample
                activateOnFocus={settings.activateOnFocus}
                initialValue="schedules"
                orientation="vertical"
              />
            </div>
          </div>
        </section>

        <section className={styles.case}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Vertical tabs inside a ScrollArea</h2>
            <p className={styles.caseText}>
              Vertical tabs where the overflow belongs to <code>ScrollArea.Viewport</code>.
            </p>
          </div>
          <ScrollArea.Root className={styles.scrollAreaRootVertical}>
            <ScrollArea.Viewport className={styles.scrollAreaViewportVertical}>
              <ScrollArea.Content className={styles.scrollAreaContent}>
                <TabsExample activateOnFocus={settings.activateOnFocus} orientation="vertical" />
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={styles.scrollbar} keepMounted orientation="vertical">
              <ScrollArea.Thumb className={styles.thumb} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </section>

        <section className={styles.case}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Horizontal toolbar inside nested wrappers</h2>
            <p className={styles.caseText}>
              The toolbar is inside extra layout wrappers while an inner div owns horizontal
              overflow.
            </p>
          </div>
          <div className={styles.nestedOuter}>
            <div className={styles.nestedInner}>
              <div className={styles.scrollerX}>
                <ToolbarExample orientation="horizontal" />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.case}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Vertical tabs inside a regular outer scroller</h2>
            <p className={styles.caseText}>
              Compare an inner tabs scroller with a case where the outer container alone owns the
              vertical scrolling.
            </p>
          </div>
          <div className={styles.outerFlowGrid}>
            <div className={styles.outerFlowScroller}>
              <div className={styles.flowStack}>
                <FlowBlock title="Intro copy" />
                <FlowBlock title="Status summary" />
                <div className={styles.flowVariant}>
                  <strong className={styles.flowVariantTitle}>Inner tabs scroller</strong>
                  <div className={styles.flowTabsFrame}>
                    <TabsExample
                      activateOnFocus={settings.activateOnFocus}
                      orientation="vertical"
                    />
                  </div>
                </div>
                <FlowBlock title="Activity feed" />
                <FlowBlock title="Audit notes" />
              </div>
            </div>
            <div className={styles.outerFlowScroller}>
              <div className={styles.flowStack}>
                <FlowBlock title="Intro copy" />
                <FlowBlock title="Status summary" />
                <div className={styles.flowVariant}>
                  <strong className={styles.flowVariantTitle}>Outer scroller only</strong>
                  <TabsExample activateOnFocus={settings.activateOnFocus} orientation="vertical" />
                </div>
                <FlowBlock title="Activity feed" />
                <FlowBlock title="Audit notes" />
              </div>
            </div>
          </div>
        </section>

        <section className={clsx(styles.case, styles.bodyCase)}>
          <div className={styles.caseHeader}>
            <h2 className={styles.caseTitle}>Document flow body scroll</h2>
            <p className={styles.caseText}>
              No div scroll container here. Start near the top of the list and arrow downward to see
              whether the page itself scrolls.
            </p>
          </div>
          <ToggleGroupExample />
        </section>
      </DirectionProvider>
    </div>
  );
}

function TabsExample(props: {
  activateOnFocus: boolean;
  orientation?: 'horizontal' | 'vertical';
  initialValue?: string;
}) {
  const {
    activateOnFocus,
    initialValue = TAB_ITEMS[0].toLowerCase(),
    orientation = 'horizontal',
  } = props;
  const [value, setValue] = React.useState(initialValue);

  return (
    <Tabs.Root
      className={styles.tabsRoot}
      onValueChange={setValue}
      orientation={orientation}
      value={value}
    >
      <Tabs.List
        activateOnFocus={activateOnFocus}
        aria-label="Project sections"
        className={clsx(styles.tabsList, orientation === 'vertical' && styles.tabsListVertical)}
      >
        {TAB_ITEMS.map((item) => (
          <Tabs.Tab
            className={clsx(styles.tabsTab, orientation === 'vertical' && styles.tabsTabVertical)}
            key={item}
            value={item.toLowerCase()}
          >
            {item}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator
          className={clsx(
            styles.tabsIndicator,
            orientation === 'vertical' && styles.tabsIndicatorVertical,
          )}
        />
      </Tabs.List>
    </Tabs.Root>
  );
}

function ToolbarExample(props: { orientation: 'horizontal' | 'vertical' }) {
  const { orientation } = props;
  return (
    <Toolbar.Root
      aria-label={`${orientation} tools`}
      className={clsx(styles.toolbar, orientation === 'horizontal' && styles.toolbarHorizontal)}
      orientation={orientation}
    >
      {TOOLBAR_ITEMS.map((item, index) => (
        <React.Fragment key={item}>
          <Toolbar.Button
            className={clsx(
              styles.toolbarButton,
              orientation === 'horizontal' && styles.toolbarButtonHorizontal,
            )}
          >
            {item}
          </Toolbar.Button>
          {index < TOOLBAR_ITEMS.length - 1 ? (
            <Toolbar.Separator
              className={clsx(
                styles.toolbarSeparator,
                orientation === 'horizontal' && styles.toolbarSeparatorVertical,
              )}
              orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            />
          ) : null}
        </React.Fragment>
      ))}
    </Toolbar.Root>
  );
}

function ToggleGroupExample() {
  const [value, setValue] = React.useState([TOGGLE_ITEMS[0].toLowerCase()]);

  return (
    <ToggleGroup
      aria-label="Document flow list"
      className={styles.toggleGroup}
      onValueChange={(nextValue) => {
        if (nextValue.length > 0) {
          setValue(nextValue);
        }
      }}
      orientation="vertical"
      value={value}
    >
      {TOGGLE_ITEMS.map((item) => {
        const toggleValue = item.toLowerCase();
        return (
          <Toggle className={styles.toggle} key={item} value={toggleValue}>
            {item}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

function FlowBlock(props: { title: string }) {
  const { title } = props;

  return (
    <div className={styles.flowBlock}>
      <strong className={styles.flowBlockTitle}>{title}</strong>
      <p className={styles.flowBlockText}>
        This filler content is here so the outer container owns the vertical scrolling instead of
        the composite widget itself.
      </p>
    </div>
  );
}
