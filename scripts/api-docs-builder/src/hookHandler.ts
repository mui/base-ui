import * as rae from 'react-api-extractor';
import { formatProperties, formatParameters, formatType } from './formatter';

export function formatHookData(hook: rae.ExportNode) {
  const description = hook.documentation?.description?.replace(/\n\nDocumentation: .*$/ms, '');

  // We don't support hooks with multiple signatures yet
  const signature = (hook.type as rae.FunctionNode).callSignatures[0];
  const parameters = signature.parameters;
  let formattedParameters: Record<string, any>;
  if (
    parameters.length === 1 &&
    parameters[0].type instanceof rae.ObjectNode &&
    parameters[0].name === 'params'
  ) {
    formattedParameters = formatProperties(parameters[0].type.properties);
  } else {
    formattedParameters = formatParameters(parameters);
  }

  let formattedReturnValue: Record<string, any> | string;
  if (signature.returnValueType instanceof rae.ObjectNode) {
    formattedReturnValue = formatProperties(signature.returnValueType.properties);
  } else {
    formattedReturnValue = formatType(signature.returnValueType, false, true);
  }

  return {
    name: hook.name,
    description,
    parameters: formattedParameters,
    returnValue: formattedReturnValue,
  };
}

export function isPublicHook(exportNode: rae.ExportNode) {
  return (
    exportNode.type instanceof rae.FunctionNode &&
    exportNode.name.startsWith('use') &&
    exportNode.isPublic(true)
  );
}
