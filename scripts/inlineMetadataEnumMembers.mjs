import path from 'node:path';
import ts from 'typescript';

const programCache = new Map();

function formatLocation(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
}

function loadProgram(tsconfigPath) {
  const absoluteTsconfigPath = path.resolve(tsconfigPath);
  const cached = programCache.get(absoluteTsconfigPath);
  if (cached) {
    return cached;
  }

  const configFile = ts.readConfigFile(absoluteTsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.formatDiagnostic(configFile.error, ts.createCompilerHost({})));
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(absoluteTsconfigPath),
    { noEmit: true, incremental: false, composite: false },
    absoluteTsconfigPath,
  );

  if (parsedConfig.errors.length > 0) {
    throw new Error(
      ts.formatDiagnostics(parsedConfig.errors, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      }),
    );
  }

  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const result = { checker: program.getTypeChecker(), program };
  programCache.set(absoluteTsconfigPath, result);
  return result;
}

function getEnumDeclaration(checker, node) {
  let symbol = checker.getSymbolAtLocation(node);
  if (!symbol) {
    return null;
  }

  // TypeScript exposes SymbolFlags as a bitmask.
  // eslint-disable-next-line no-bitwise
  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }

  return symbol.declarations?.find(ts.isEnumDeclaration) ?? null;
}

function isTypePosition(node) {
  let current = node.parent;
  while (current) {
    if (ts.isTypeNode(current)) {
      return true;
    }
    if (ts.isStatement(current) || ts.isExpression(current)) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

function isDeclarationName(node) {
  const { parent } = node;
  return (
    (ts.isEnumDeclaration(parent) && parent.name === node) ||
    (ts.isImportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) ||
    (ts.isImportClause(parent) && parent.name === node) ||
    (ts.isNamespaceImport(parent) && parent.name === node) ||
    (ts.isExportSpecifier(parent) && (parent.name === node || parent.propertyName === node))
  );
}

function analyzeSourceFile(sourceFile, checker, suffixes) {
  const replacements = new Map();
  const importedEnumLocals = new Set();

  function getTargetEnum(identifier) {
    const declaration = getEnumDeclaration(checker, identifier);
    if (!declaration || !suffixes.some((suffix) => declaration.name.text.endsWith(suffix))) {
      return null;
    }
    return declaration;
  }

  function recordAccess(access, identifier) {
    let memberSymbol;
    if (ts.isPropertyAccessExpression(access)) {
      memberSymbol = checker.getSymbolAtLocation(access.name);
    } else if (access.argumentExpression) {
      const memberName = access.argumentExpression.text;
      memberSymbol = checker.getTypeAtLocation(access.expression).getProperty(memberName);
    }
    const memberDeclaration = memberSymbol?.declarations?.find(ts.isEnumMember);
    const value = memberDeclaration ? checker.getConstantValue(memberDeclaration) : undefined;
    if (typeof value !== 'string') {
      throw new Error(
        `Cannot inline ${access.getText(sourceFile)} at ${formatLocation(sourceFile, access)}. ` +
          'Only statically resolved string enum members are supported.',
      );
    }

    replacements.set(`${access.getStart(sourceFile)}:${access.getEnd()}`, value);

    const declaration = identifier.parent;
    if (
      ts.isImportSpecifier(declaration) ||
      ts.isImportClause(declaration) ||
      ts.isNamespaceImport(declaration)
    ) {
      importedEnumLocals.add(identifier.text);
    } else {
      const symbol = checker.getSymbolAtLocation(identifier);
      const aliasDeclaration = symbol?.declarations?.find(
        (candidate) =>
          ts.isImportSpecifier(candidate) ||
          ts.isImportClause(candidate) ||
          ts.isNamespaceImport(candidate),
      );
      if (aliasDeclaration) {
        importedEnumLocals.add(identifier.text);
      }
    }
  }

  function visit(node) {
    // Public metadata enums are runtime exports. Leave their declaration output
    // untouched while still resolving their values when consumers read members.
    if (ts.isEnumDeclaration(node)) {
      return;
    }

    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const declaration = getTargetEnum(node.expression);
      if (declaration) {
        recordAccess(node, node.expression);
        return;
      }
    }

    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const declaration = getTargetEnum(node.expression);
      if (declaration) {
        if (
          !node.argumentExpression ||
          (!ts.isStringLiteral(node.argumentExpression) &&
            !ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))
        ) {
          throw new Error(
            `Unsupported dynamic enum member access ${node.getText(sourceFile)} at ${formatLocation(sourceFile, node)}. ` +
              'Use a static Enum.member reference.',
          );
        }
        recordAccess(node, node.expression);
        return;
      }
    }

    if (ts.isIdentifier(node) && getTargetEnum(node)) {
      if (isDeclarationName(node) || isTypePosition(node)) {
        return;
      }

      const parent = node.parent;
      if (
        (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
        parent.expression === node
      ) {
        // Static accesses return before reaching this child. Reaching this branch means
        // the access shape was unsupported and should fail rather than retain the enum object.
      }

      throw new Error(
        `Unsupported dynamic use of metadata enum ${node.text} at ${formatLocation(sourceFile, node)}. ` +
          'Only static Enum.member reads can be inlined.',
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { importedEnumLocals, replacements };
}

export function clearMetadataEnumProgramCache() {
  programCache.clear();
}

export default function inlineMetadataEnumMembers({ types: t }) {
  function replaceMember(pathRef, replacements) {
    const key = `${pathRef.node.start}:${pathRef.node.end}`;
    const value = replacements.get(key);
    if (value !== undefined) {
      pathRef.replaceWith(t.stringLiteral(value));
    }
  }

  return {
    name: 'inline-metadata-enum-members',
    visitor: {
      Program: {
        enter(programPath, state) {
          const filename = state.file.opts.filename;
          const tsconfigPath = state.opts.tsconfigPath;
          if (!filename || !tsconfigPath) {
            throw new Error('inline-metadata-enum-members requires filename and tsconfigPath.');
          }

          const { checker, program } = loadProgram(tsconfigPath);
          const sourceFile = program.getSourceFile(path.resolve(filename));
          if (!sourceFile) {
            throw new Error(`TypeScript program does not contain ${filename}.`);
          }

          const analysis = analyzeSourceFile(
            sourceFile,
            checker,
            state.opts.suffixes ?? ['DataAttributes', 'CssVars'],
          );
          state.metadataEnumAnalysis = analysis;

          // Replace member reads before other Babel transforms can rewrite their source
          // positions. Enum declarations themselves remain unchanged above.
          programPath.traverse({
            MemberExpression(pathRef) {
              replaceMember(pathRef, analysis.replacements);
            },
            OptionalMemberExpression(pathRef) {
              replaceMember(pathRef, analysis.replacements);
            },
          });
        },
        exit(programPath, state) {
          const importedEnumLocals = state.metadataEnumAnalysis?.importedEnumLocals;
          if (!importedEnumLocals || importedEnumLocals.size === 0) {
            return;
          }

          programPath.scope.crawl();
          for (const importPath of programPath.get('body')) {
            if (!importPath.isImportDeclaration()) {
              continue;
            }

            const originalSpecifierCount = importPath.node.specifiers.length;
            for (const specifierPath of importPath.get('specifiers')) {
              const localName = specifierPath.node.local.name;
              if (!importedEnumLocals.has(localName)) {
                continue;
              }

              const binding = programPath.scope.getBinding(localName);
              if (!binding?.referenced) {
                specifierPath.remove();
              }
            }

            if (originalSpecifierCount > 0 && importPath.node.specifiers.length === 0) {
              importPath.remove();
            }
          }
        },
      },
    },
  };
}
