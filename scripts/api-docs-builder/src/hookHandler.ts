import * as tae from 'typescript-api-extractor';
import { formatProperties, formatParameters, formatType } from './formatter';

export async function formatHookData(hook: tae.ExportNode) {
  const description = hook.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');

  // We don't support hooks with multiple signatures yet
  const signature = (hook.type as tae.FunctionNode).callSignatures[0];
  const parameters = signature.parameters;
  let formattedParameters: Record<string, any>;
  if (
    parameters.length === 1 &&
    parameters[0].type instanceof tae.ObjectNode &&
    parameters[0].name === 'params'
  ) {
    formattedParameters = await formatProperties(parameters[0].type.properties, []);
  } else {
    formattedParameters = formatParameters(parameters);
  }

  let formattedReturnValue: Record<string, any> | string;
  if (signature.returnValueType instanceof tae.ObjectNode) {
    formattedReturnValue = await formatProperties(signature.returnValueType.properties, []);
  } else {
    formattedReturnValue = formatType(signature.returnValueType, false, undefined, true);
  }

  return {
    name: hook.name,
    description,
    parameters: formattedParameters,
    returnValue: formattedReturnValue,
  };
}

export function isPublicHook(exportNode: tae.ExportNode) {
  return (
    exportNode.type instanceof tae.FunctionNode &&
    exportNode.name.startsWith('use') &&
    exportNode.isPublic(true)
  );
}
