import * as tae from 'typescript-api-extractor';
import { formatParameters, formatType, type DocumentationOverride } from './formatter';

function extractDescription(documentation: tae.Documentation | undefined) {
  if (!documentation?.description) {
    return '';
  }

  if (typeof documentation.description === 'string') {
    return documentation.description.replace(/\n\nDocumentation: .*$/ms, '');
  }

  if (Array.isArray(documentation.description)) {
    const descArray = documentation.description as any[];
    return descArray
      .map((node: any) => {
        if (typeof node === 'string') {
          return node;
        }
        if (node && typeof node === 'object') {
          if (node.kind && typeof node.getText === 'function') {
            let text = node.getText();
            text = text
              .replace(/^\/\*\*\s*/, '')
              .replace(/\s*\*\/\s*$/, '')
              .replace(/^\s*\*\s?/gm, '');
            return text;
          }
          if (node.text) {
            return node.text;
          }
          if (node.target) {
            return node.target;
          }
        }
        return '';
      })
      .join('')
      .trim()
      .replace(/\n\nDocumentation: .*$/ms, '');
  }

  if (typeof documentation.description === 'object') {
    const desc = documentation.description as any;
    if (typeof desc.getText === 'function') {
      return desc.getText();
    }
    return desc.text || desc.target || '';
  }

  return '';
}

function extractReturnDescription(documentation: tae.Documentation | undefined) {
  const returnTag = documentation?.tags?.find(
    (tag) => tag.name === 'returns' || tag.name === 'return',
  );
  if (!returnTag?.value) {
    return undefined;
  }

  const description = returnTag.value.replace(/^\s*-\s*/, '').trim();
  return description || undefined;
}

function applyParamTags(
  tags: tae.DocumentationTag[] | undefined,
  parameters: tae.Parameter[],
  documentationOverrides: Array<DocumentationOverride | undefined>,
) {
  if (!tags?.length) {
    return;
  }

  for (const tag of tags) {
    if (tag.name !== 'param' || typeof tag.value !== 'string') {
      continue;
    }

    const trimmed = tag.value.trim();
    if (!trimmed) {
      continue;
    }

    const [paramName, ...rest] = trimmed.split(/\s+/);
    if (!paramName) {
      continue;
    }

    const description = rest.join(' ').replace(/^-\s*/, '');
    if (!description) {
      continue;
    }

    const index = parameters.findIndex((param) => param.name === paramName);
    if (index === -1 || documentationOverrides[index]) {
      continue;
    }

    documentationOverrides[index] = { description };
  }
}

export async function formatUtilityData(utility: tae.ExportNode) {
  const functionNode = utility.type as tae.FunctionNode;

  // Find the signature with the most parameters (likely the implementation signature)
  let bestSignature = functionNode.callSignatures[0];
  let maxParams = bestSignature.parameters.length;

  for (const sig of functionNode.callSignatures) {
    if (sig.parameters.length > maxParams) {
      bestSignature = sig;
      maxParams = sig.parameters.length;
    }
  }

  // Try to get description from the utility node's documentation
  let description = extractDescription(utility.documentation);

  // Append @important tag content to description if present
  const importantTag = utility.documentation?.tags?.find((tag) => tag.name === 'important');
  if (importantTag?.value) {
    description += `\n\n${importantTag.value}`;
  }

  const returnDescription = extractReturnDescription(utility.documentation);

  const parameters = bestSignature.parameters;
  const optionalOverrides = parameters.map((param, index) => {
    if (param.optional) {
      return true;
    }

    for (const signature of functionNode.callSignatures) {
      if (signature.parameters.length <= index) {
        return true;
      }

      if (signature.parameters[index]?.optional) {
        return true;
      }
    }

    return false;
  });

  const documentationOverrides = Array<DocumentationOverride | undefined>(parameters.length).fill(
    undefined,
  );

  for (const signature of functionNode.callSignatures) {
    signature.parameters.forEach((param, index) => {
      if (documentationOverrides[index]) {
        return;
      }

      const documentation = param.documentation;
      if (documentation?.description || documentation?.tags?.length) {
        documentationOverrides[index] = documentation;
      }
    });
  }

  applyParamTags(utility.documentation?.tags, parameters, documentationOverrides);

  const formattedParameters = formatParameters(
    parameters,
    optionalOverrides,
    documentationOverrides,
  );

  const formattedReturnValue = formatType(bestSignature.returnValueType, false, undefined, true);

  return {
    name: utility.name,
    description,
    parameters: formattedParameters,
    returnValue: returnDescription
      ? {
          type: formattedReturnValue,
          description: returnDescription,
        }
      : formattedReturnValue,
  };
}

export function isPublicUtility(exportNode: tae.ExportNode) {
  return (
    exportNode.type instanceof tae.FunctionNode &&
    !exportNode.name.startsWith('use') && // Exclude hooks
    exportNode.isPublic(true)
  );
}
