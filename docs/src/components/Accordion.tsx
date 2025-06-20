'use client';
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import clsx from 'clsx';

export function Root(props: Accordion.Root.Props) {
  return <Accordion.Root {...props} className={clsx('AccordionRoot', props.className)} />;
}

export function Item(props: Accordion.Item.Props) {
  return <Accordion.Item {...props} className={clsx('AccordionItem', props.className)} />;
}

export function Header(props: Accordion.Header.Props) {
  return <Accordion.Header {...props} className={clsx('AccordionHeader', props.className)} />;
}

export function Trigger(props: Accordion.Trigger.Props) {
  return <Accordion.Trigger {...props} className={clsx('AccordionTrigger', props.className)} />;
}

export function Panel(props: Accordion.Panel.Props) {
  return <Accordion.Panel {...props} className={clsx('AccordionPanel', props.className)} />;
}

export function Content(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('AccordionContent', props.className)} />;
}
