import path from 'path';

const repositoryRoot = path.resolve(__dirname, '../../..');

// components which names do not start with directory name
const componentExportExceptions: Record<string, string> = {
  Tab: 'Tab',
  TabIndicator: 'Indicator',
  TabPanel: 'Panel',
};

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getComponentImports(name: string, filename: string) {
  const relativePath = path.relative(repositoryRoot, filename);
  const directories = path.dirname(relativePath).split(path.sep);
  if (directories[0] !== 'packages' || directories[1] !== 'react' || directories[2] !== 'src') {
    throw new Error(`The file ${filename} is not in the Base UI package`);
  }

  if (directories.length < 4) {
    throw new Error(`The file ${filename} is not in a subdirectory of packages/react/src`);
  }

  // @base-ui-components/react/number-field => number-field
  const componentDirectory = directories[3];
  // @base-ui-components/react/number-field => NumberField
  const mainImportName = capitalizeFirstLetter(
    componentDirectory.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
  );

  if (mainImportName === name) {
    return [`import { ${name} } from '@base-ui-components/react/${componentDirectory}';`];
  }

  if (Object.keys(componentExportExceptions).includes(name)) {
    return [
      `import { ${mainImportName} } from '@base-ui-components/react/${componentDirectory}';\nconst ${name} = ${mainImportName}.${componentExportExceptions[name]};`,
    ];
  }

  if (name.startsWith(mainImportName) && !name.startsWith('use')) {
    // cases like Switch/SwitchTrack.tsx
    const childName = name.slice(mainImportName.length);
    return [
      `import { ${mainImportName} } from '@base-ui-components/react/${componentDirectory}';\nconst ${name} = ${mainImportName}.${childName};`,
    ];
  }

  return [`import { ${name} } from '@base-ui-components/react/${componentDirectory}';`];
}
