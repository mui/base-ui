import * as React from 'react';
import { getDependencyFiles } from 'docs/src/components/Demo/DemoLoader';
import { SandboxLink } from './SandboxLink';

export async function EditPanel(props: EditPanelProps) {
  const { experimentPath, ...otherProps } = props;

  const dependencies = await getDependencyFiles([experimentPath], true);

  return (
    <div {...otherProps}>
      <h2>Edit</h2>
      <SandboxLink files={dependencies}>
        Open in CodeSandbox ({experimentPath})
      </SandboxLink>
    </div>
  );
}

interface EditPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  experimentPath: string;
}
