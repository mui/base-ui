import * as React from 'react';
import * as DocsComponents from 'docs-base/src/modules/components';
import classes from './MDXComponents.module.css';
import { Callout, type CalloutProps } from './Callout';

export const components = {
  ...DocsComponents,
  Callout: (props: CalloutProps) => <Callout {...props} />,
  ComponentLinkHeader: () => (
    <DocsComponents.ComponentLinkHeader className={classes.todo}>
      Component links
    </DocsComponents.ComponentLinkHeader>
  ),
  ComponentPageTabs: () => null,
};
