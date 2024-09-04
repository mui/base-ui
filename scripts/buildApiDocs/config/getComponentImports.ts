import path from 'path';

const repositoryRoot = path.resolve(__dirname, '../../..');

// components which names do not start with directory name
const componentExportExceptions: Record<string, string> = {
  Tab: 'Tab',
  TabIndicator: 'Indicator',
  TabPanel: 'Panel',
};

export function getComponentImports(name: string, filename: string) {
  const relativePath = path.relative(repositoryRoot, filename);
  const directories = path.dirname(relativePath).split(path.sep);
  if (directories[0] !== 'packages' || directories[1] !== 'mui-base' || directories[2] !== 'src') {
    throw new Error(`The file ${filename} is not in the Base UI package`);
  }

  if (directories.length < 4) {
    throw new Error(`The file ${filename} is not in a subdirectory of packages/mui-base/src`);
  }

  if (directories[3] === 'legacy') {
    return [`import { ${name} } from '@base_ui/react/legacy/${directories[4]}';`];
  }

  const componentDirectory = directories[3];
  if (componentDirectory === name) {
    return [`import { ${name} } from '@base_ui/react/${name}';`];
  }

  if (Object.keys(componentExportExceptions).includes(name)) {
    return [
      `import * as ${componentDirectory} from '@base_ui/react/${componentDirectory}';\nconst ${name} = ${componentDirectory}.${componentExportExceptions[name]};`,
    ];
  }

  if (name.startsWith(componentDirectory) && !name.startsWith('use')) {
    // cases like Switch/SwitchTrack.tsx
    const childName = name.slice(componentDirectory.length);
    return [
      `import * as ${componentDirectory} from '@base_ui/react/${componentDirectory}';\nconst ${name} = ${componentDirectory}.${childName};`,
    ];
  }

  return [`import { ${name} } from '@base_ui/react/${componentDirectory}';`];
}
