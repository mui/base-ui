import path from 'path';
import { ProjectSettings } from '@mui-internal/api-docs-builder';
import findApiPages from '@mui-internal/api-docs-builder/utils/findApiPages';
import { getBaseUiComponentInfo } from './getBaseUiComponentInfo';
import { getComponentImports } from './getComponentImports';

export const projectSettings: ProjectSettings = {
  output: {
    apiManifestPath: path.join(process.cwd(), 'docs/data/pagesApi.js'),
    writeApiManifest: false,
  },
  typeScriptProjects: [
    {
      name: 'base',
      rootPath: path.join(process.cwd(), 'packages/react'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  baseApiUrl: 'https://base-ui.com',
  getApiPages: () => findApiPages('docs/data/api'),
  getComponentInfo: getBaseUiComponentInfo,
  getComponentImports,
  translationLanguages: ['en'],
  skipComponent: () => false,
  skipHook: () => true,
  skipAnnotatingComponentDefinition: false,
  skipSlotsAndClasses: true,
  generateJsonFileOnly: true,
  translationPagesDirectory: 'docs/data/translations/api-docs',
  generateClassName: () => '',
  isGlobalClassName: () => false,
};

// Temporary: the old settings will be removed soon
export const newProjectSettings: ProjectSettings = {
  typeScriptProjects: [
    {
      name: 'base',
      rootPath: path.join(process.cwd(), 'packages/react'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  // TODO update domain and routing when we are ready
  baseApiUrl: 'https://base-ui.com',
  getComponentInfo: (filename) => ({
    ...getBaseUiComponentInfo(filename),
    apiPagesDirectory: path.join(process.cwd(), `docs/reference/temp/components`),
  }),
  translationPagesDirectory: 'docs/reference/temp/translations',

  // Disabled features
  generateClassName: () => '',
  generateJsonFileOnly: true,
  getApiPages: () => [],
  getComponentImports: () => [],
  isGlobalClassName: () => false,
  skipAnnotatingComponentDefinition: false,
  skipComponent: () => false,
  skipHook: () => true,
  skipSlotsAndClasses: true,
  translationLanguages: ['en'],
  output: {
    apiManifestPath: '',
    writeApiManifest: false,
  },
};
