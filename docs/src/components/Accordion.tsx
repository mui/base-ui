'use client';
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import clsx from 'clsx';

export function Root({ className, ...props }: Accordion.Root.Props) {
  return <Accordion.Root className={clsx('AccordionRoot', className)} {...props} />;
}

export function Item({ className, ...props }: Accordion.Item.Props) {
  return <Accordion.Item className={clsx('AccordionItem', className)} {...props} />;
}

export function Header({ className, ...props }: Accordion.Header.Props) {
  return <Accordion.Header className={clsx('AccordionHeader', className)} {...props} />;
}

export function Trigger({ className, ...props }: Accordion.Trigger.Props) {
  return <Accordion.Trigger className={clsx('AccordionTrigger', className)} {...props} />;
}

export function Panel({ className, ...props }: Accordion.Panel.Props) {
  return <Accordion.Panel className={clsx('AccordionPanel', className)} {...props} />;
}

export function Content({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('AccordionContent', className)} {...props} />;
}
