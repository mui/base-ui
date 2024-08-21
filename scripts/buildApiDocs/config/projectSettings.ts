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
      rootPath: path.join(process.cwd(), 'packages/mui-base'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  // TODO: Update when we have the domain set up
  baseApiUrl: 'https://base-ui.netlify.app',
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
