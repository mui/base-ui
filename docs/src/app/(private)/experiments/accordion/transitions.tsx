'use client';
import * as React from 'react';
import clsx from 'clsx';
import type { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import * as Accordion from './_components/Accordion';
import layoutStyles from './accordion.module.css';
import styles from './transitions.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  multiple: {
    type: 'boolean',
    label: 'Allow multiple open',
    default: true,
  },
};

const ITEMS = [
  {
    title: 'What is Base UI?',
    content:
      'Base UI is a library of high-quality unstyled React components for design systems and web apps.',
  },
  {
    title: 'How do I get started?',
    content:
      'Head to the “Quick start” guide in the docs. If you’ve used unstyled libraries before, you’ll feel at home.',
  },
  {
    title: 'Can I use it for my project?',
    content: 'Of course! Base UI is free and open source.',
  },
] as const;

const HIDDEN_TEXT = 'The margin note mentioned amber inlet before the page was folded shut.';

interface ExampleAccordionProps extends Pick<
  BaseAccordion.Root.Props<number>,
  'defaultValue' | 'hiddenUntilFound' | 'keepMounted' | 'multiple' | 'onValueChange' | 'value'
> {
  hiddenTextIndex?: number;
  rootClassName?: string;
  triggerNumbers: [number, number, number];
}

function ExampleAccordion({
  defaultValue,
  hiddenTextIndex,
  hiddenUntilFound,
  keepMounted,
  multiple,
  onValueChange,
  rootClassName,
  triggerNumbers,
  value,
}: ExampleAccordionProps) {
  return (
    <Accordion.Root
      className={clsx(styles.root, rootClassName)}
      defaultValue={value === undefined ? defaultValue : undefined}
      hiddenUntilFound={hiddenUntilFound}
      keepMounted={keepMounted}
      multiple={multiple}
      onValueChange={onValueChange}
      value={value}
    >
      {ITEMS.map((item, index) => (
        <Accordion.Item key={item.title} value={index}>
          <Accordion.Header>
            <Accordion.Trigger>
              Trigger {triggerNumbers[index]}: {item.title}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.panel}>
            <Accordion.Content>
              <p>{item.content}</p>
              {hiddenTextIndex === index ? <p>{HIDDEN_TEXT}</p> : null}
            </Accordion.Content>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function ActivityComparison({ multiple }: Pick<ExampleAccordionProps, 'multiple'>) {
  const [visible, setVisible] = React.useState(true);

  return (
    <React.Fragment>
      <button
        type="button"
        className={layoutStyles.nativeButton}
        onClick={() => setVisible((prev) => !prev)}
      >
        {visible ? 'Hide sections' : 'Show sections'}
      </button>

      <small>regular mount</small>
      {visible ? (
        <ExampleAccordion defaultValue={[0]} multiple={multiple} triggerNumbers={[42, 43, 44]} />
      ) : null}

      <small>React.Activity</small>
      <React.Activity mode={visible ? 'visible' : 'hidden'}>
        <ExampleAccordion defaultValue={[0]} multiple={multiple} triggerNumbers={[45, 46, 47]} />
      </React.Activity>
    </React.Fragment>
  );
}

export default function CssTransitions() {
  const { settings } = useExperimentSettings<Settings>();
  const [value, setValue] = React.useState<number[]>([0]);
  const multiple = settings.multiple;

  return (
    <div className={layoutStyles.grid}>
      <div className={layoutStyles.wrapper}>
        <pre>keepMounted: true</pre>
        <ExampleAccordion
          defaultValue={[0]}
          keepMounted
          multiple={multiple}
          triggerNumbers={[27, 28, 29]}
        />
        <small>———</small>
      </div>

      <div className={layoutStyles.wrapper}>
        <pre>keepMounted: false</pre>
        <ExampleAccordion
          defaultValue={[0]}
          keepMounted={false}
          multiple={multiple}
          triggerNumbers={[30, 31, 32]}
        />
        <small>———</small>
      </div>

      <div className={layoutStyles.wrapper}>
        <pre>controlled</pre>
        <ExampleAccordion
          multiple={multiple}
          onValueChange={setValue}
          triggerNumbers={[33, 34, 35]}
          value={value}
        />
        <small>———</small>

        <pre>slow</pre>
        <ExampleAccordion
          defaultValue={[0]}
          multiple={multiple}
          rootClassName={styles.slowRoot}
          triggerNumbers={[36, 37, 38]}
        />
        <small>———</small>
      </div>

      <div className={layoutStyles.wrapper}>
        <pre>hiddenUntilFound</pre>
        <ExampleAccordion
          defaultValue={[]}
          hiddenTextIndex={1}
          hiddenUntilFound
          multiple={multiple}
          triggerNumbers={[39, 40, 41]}
        />
        <small>———</small>

        <pre>React.Activity</pre>
        <ActivityComparison multiple={multiple} />
        <small>———</small>
      </div>
    </div>
  );
}
