import * as React from 'react';
import { getDependencyFiles } from 'docs/src/components/Demo/DemoLoader';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SandboxLink } from './SandboxLink';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export async function EditPanel(props: EditPanelProps) {
  const { experimentPath, ...otherProps } = props;

  const dependencies = await getDependencyFiles(
    [experimentPath, resolve(currentDirectory, './SettingsPanel.tsx')],
    true,
  );

  return (
    <div {...otherProps}>
      <h2>Edit</h2>
      <SandboxLink files={dependencies}>Open in CodeSandbox ({experimentPath})</SandboxLink>
    </div>
  );
}

interface EditPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  experimentPath: string;
}
