import * as React from 'react';
import clsx from 'clsx';
import { ExperimentsList } from './ExperimentsList';
import { EditPanel } from './EditPanel';
import classes from './Sidebar.module.css';

export function Sidebar(props: SidebarProps) {
  const { experimentPath, className, ...otherProps } = props;
  return (
    <div {...otherProps} className={clsx(classes.root, className)}>
      {experimentPath && (
        <React.Fragment>
          <div id="experiments-settings" className={classes.panel} />
          <EditPanel className={classes.panel} experimentPath={experimentPath} />
        </React.Fragment>
      )}
      <ExperimentsList className={classes.panel} />
    </div>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  experimentPath?: string;
}
