export function throwMissingContextError(
  contextName: string,
  rootComponentName: string,
  contextProviderComponent: string,
): never {
  throw new Error(
    `Base UI: ${contextName} is missing. ${rootComponentName} parts must be used within a <${contextProviderComponent}>.`,
  );
}
