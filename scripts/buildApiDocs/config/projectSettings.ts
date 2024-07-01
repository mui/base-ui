import path from 'path';
import { LANGUAGES } from 'docs/config';
import { ProjectSettings } from '@mui-internal/api-docs-builder';
import findApiPages from '@mui-internal/api-docs-builder/utils/findApiPages';
import { getBaseUiComponentInfo } from './getBaseUiComponentInfo';
import { getBaseUiHookInfo } from './getBaseUiHookInfo';
import { generateBaseUIApiPages } from './generateBaseUiApiPages';
import { generateApiLinks } from './generateApiLinks';
import { getComponentImports } from './getComponentImports';

export const projectSettings: ProjectSettings = {
  output: {
    apiManifestPath: path.join(process.cwd(), 'docs/data/base/pagesApi.js'),
  },
  typeScriptProjects: [
    {
      name: 'base',
      rootPath: path.join(process.cwd(), 'packages/mui-base'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  getApiPages: () => findApiPages('docs/pages/base-ui/api'),
  getComponentInfo: getBaseUiComponentInfo,
  getComponentImports,
  getHookInfo: getBaseUiHookInfo,
  getHookImports: getComponentImports,
  translationLanguages: LANGUAGES,
  skipComponent: () => false,
  onCompleted: async () => {
    await generateBaseUIApiPages();
  },
  onWritingManifestFile(builds, source) {
    const apiLinks = generateApiLinks(builds);
    if (apiLinks.length > 0) {
      return `module.exports = ${JSON.stringify(apiLinks)}`;
    }

    return source;
  },
  skipAnnotatingComponentDefinition: true,
  skipSlotsAndClasses: true,
  generateJsonFileOnly: true,
  translationPagesDirectory: 'docs/translations/api-docs',
  generateClassName: () => '',
  isGlobalClassName: () => false,
};
