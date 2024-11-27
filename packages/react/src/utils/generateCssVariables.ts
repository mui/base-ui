export function generateCssVariables<T extends string>(cssVars: T[]): Record<T, string> {
  const result: Record<string, string> = {};

  cssVars.forEach((cssVar) => {
    result[cssVar] = cssVar.replace(/([A-Z])/g, '-$1').toLowerCase();
  });

  return result;
}
