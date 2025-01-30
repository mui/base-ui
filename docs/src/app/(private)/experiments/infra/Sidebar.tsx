import * as React from 'react';
import { ExperimentsList } from './ExperimentsList';
import { EditPanel } from './EditPanel';
import classes from './Sidebar.module.css';

export function Sidebar(props: SidebarProps) {
  const { experimentPath } = props;
  return (
    <div className={classes.root}>
      <div id="experiments-settings" className={classes.panel} />
      <EditPanel className={classes.panel} experimentPath={experimentPath} />
      <ExperimentsList className={classes.panel} />
    </div>
  );
}

interface SidebarProps {
  experimentPath: string;
}
