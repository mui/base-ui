/* eslint-disable no-console */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ApiDeclaredItem,
  ApiItem,
  ApiModel,
  ApiPackage,
  ExcerptToken,
} from '@microsoft/api-extractor-model';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(currentDir, '../../../');
const apiDefinition = path.join(repoRoot, './docs/reference/api-report/react.api.json');

const apiModel: ApiModel = new ApiModel();
const apiPackage: ApiPackage = apiModel.loadPackage(apiDefinition);

listMembers([apiPackage]);

function listMembers(items: readonly ApiItem[]) {
  for (const item of items) {
    if (
      item instanceof ApiDeclaredItem &&
      item.kind === 'Variable' &&
      item.excerptTokens.length >= 2 &&
      item.excerptTokens[1].kind === 'Reference' &&
      item.excerptTokens[1].canonicalReference.toString() ===
        '@types/react!React.ForwardRefExoticComponent:interface'
    ) {
      console.log('possible component', item.getScopedNameWithinPackage());
    }

    if (item.members) {
      listMembers(item.members);
    }
  }
}
