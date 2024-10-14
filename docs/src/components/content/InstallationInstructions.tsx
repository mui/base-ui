import * as React from 'react';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';

export interface InstallationInstructionsProps {
  componentName: string | string[];
}

export function InstallationInstructions(props: InstallationInstructionsProps) {
  const { componentName } = props;

  let componentNames: string[];

  if (!Array.isArray(componentName)) {
    componentNames = [componentName];
  } else {
    componentNames = componentName;
  }

  return (
    <React.Fragment>
      <p>Base UI components are all available as a single package.</p>
      <PackageManagerSnippet>
        <Npm>npm install @base_ui/react</Npm>
        <Pnpm>pnpm add @base_ui/react</Pnpm>
        <Yarn>yarn add @base_ui/react</Yarn>
      </PackageManagerSnippet>
      <p>Once you have the package installed, import the component.</p>
      <pre>
        {componentNames
          .map((name) => `import { ${name} } from '@base_ui/react/${name}';`)
          .join('\n')}
      </pre>
    </React.Fragment>
  );
}
