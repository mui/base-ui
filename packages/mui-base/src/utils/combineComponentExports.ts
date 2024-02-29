export function combineComponentExports<Root, Subcomponents extends {}>(
  rootComponent: Root,
  subcomponents: Subcomponents,
) {
  Object.entries(subcomponents).forEach(([subcomponentName, subcomponent]) => {
    // @ts-expect-error
    rootComponent[subcomponentName] = subcomponent;
  });

  return rootComponent as Root & Subcomponents;
}
