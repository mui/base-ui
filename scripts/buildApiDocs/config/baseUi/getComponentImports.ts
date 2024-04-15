import path from 'path';

const repositoryRoot = path.resolve(__dirname, '../../../..');

export function getComponentImports(name: string, filename: string) {
  const relativePath = path.relative(repositoryRoot, filename);
  const directories = path.dirname(relativePath).split(path.sep);
  if (directories[0] !== 'packages' || directories[1] !== 'mui-base' || directories[2] !== 'src') {
    throw new Error(`The file ${filename} is not in the Base UI package`);
  }

  if (directories.length < 4) {
    throw new Error(`The file ${filename} is not in a subdirectory of packages/mui-base/src`);
  }

  const componentDirectory = directories[3];
  if (componentDirectory === name) {
    return [
      `import { ${name} } from '@base_ui/react/${name}';`,
      `import { ${name} } from '@base_ui/react';`,
    ];
  }

  if (name.startsWith(componentDirectory) && !name.startsWith('use')) {
    // cases like Switch/SwitchTrack.tsx
    const childName = name.slice(componentDirectory.length);
    return [
      `import * as ${componentDirectory} from '@base_ui/react/${componentDirectory}';\nconst ${name} = ${componentDirectory}.${childName};`,
      `import { ${name} } from '@base_ui/react';`,
    ];
  }

  return [
    `import { ${name} } from '@base_ui/react/${componentDirectory}';`,
    `import { ${name} } from '@base_ui/react';`,
  ];
}
