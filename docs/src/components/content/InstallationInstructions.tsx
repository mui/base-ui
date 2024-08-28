import * as React from 'react';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';

export interface InstallationInstructionsProps {
  componentName: string;
}

export function InstallationInstructions(props: InstallationInstructionsProps) {
  const { componentName } = props;

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
        import * as {componentName} from &apos;@base_ui/react/{componentName}&apos;;
      </pre>
    </React.Fragment>
  );
}
