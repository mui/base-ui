import * as React from 'react';
import * as DocsComponents from 'docs-base/src/modules/components';
import classes from './MDXComponents.module.css';

export const components = {
  ...DocsComponents,
  Demo: (props: any) => (
    <DocsComponents.Demo className={classes.todo}>{props.demo} demo</DocsComponents.Demo>
  ),
  ComponentLinkHeader: () => (
    <DocsComponents.ComponentLinkHeader className={classes.todo}>
      Component links
    </DocsComponents.ComponentLinkHeader>
  ),
  ComponentPageTabs: () => null,
};
