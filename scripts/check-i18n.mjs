import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceRoots = ["app", "lib"];
const languageConfigFile = "lib/site-language.ts";
const referenceLanguagePreference = ["en", "ru"];
const placeholderPattern = /^(?:TODO|FIXME|missing translation|undefined|null|NaN|\[object Object\])$/i;
const leakedKeyPattern = /^(?:header|booking|common|account|company|catalog|public|pro|settings)\.[a-zA-Z0-9_.-]+$/;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function walk(dir) {
  const absoluteDir = path.join(root, dir);
  if (!fs.existsSync(absoluteDir)) return [];

  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(relativePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

function parseSource(file) {
  return ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function getArrayLiteralStrings(sourceFile, variableName) {
  let result = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === variableName) {
      const initializer = node.initializer;
      if (initializer && ts.isArrayLiteralExpression(initializer)) {
        result = initializer.elements
          .filter((element) => ts.isStringLiteral(element))
          .map((element) => element.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}

function discoverLanguages() {
  const sourceFile = parseSource(languageConfigFile);
  const base = getArrayLiteralStrings(sourceFile, "baseSiteLanguages");
  const extra = getArrayLiteralStrings(sourceFile, "extraSiteLanguages");
  const languages = [...base, ...extra];

  if (!languages.length) {
    throw new Error(`Could not determine project languages from ${languageConfigFile}.`);
  }

  return [...new Set(languages)];
}

const languages = discoverLanguages();
const languageSet = new Set(languages);
const referenceLanguage = referenceLanguagePreference.find((language) => languageSet.has(language)) ?? languages[0];
const sourceFiles = sourceRoots.flatMap(walk);
const failures = [];
const warnings = [];
let dictionariesChecked = 0;
let leafKeysChecked = 0;
let fallbackGeneratedKeys = 0;

function position(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
}

function propertyName(sourceFile, name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return name.getText(sourceFile);
}

function callName(sourceFile, expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  return expression.getText(sourceFile);
}

function isLanguageMap(sourceFile, objectLiteral) {
  const keys = objectLiteral.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => propertyName(sourceFile, property.name));
  const languageKeys = keys.filter((key) => languageSet.has(key));
  return languageKeys.length >= Math.min(3, languages.length) && languageKeys.length === keys.length;
}

function hasSpread(sourceFile, objectLiteral) {
  return objectLiteral.properties.some((property) => ts.isSpreadAssignment(property));
}

function isArrayShapeKey(key) {
  return /(?:^|\.)\d+(?:\.|$)|\.\$length$/.test(key);
}

function findDuplicateKeys(sourceFile, objectLiteral, prefix, reportAt) {
  const seen = new Set();
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(sourceFile, property.name);
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (seen.has(key)) {
      failures.push(`${reportAt}: duplicate translation key "${fullKey}".`);
    }
    seen.add(key);
    if (ts.isObjectLiteralExpression(property.initializer)) {
      findDuplicateKeys(sourceFile, property.initializer, fullKey, reportAt);
    }
  }
}

function flattenValue(sourceFile, node, prefix = "") {
  const values = new Map();

  function set(key, value, valueNode) {
    const normalizedKey = key || "$value";
    values.set(normalizedKey, { value, node: valueNode });
  }

  function visit(valueNode, key) {
    if (ts.isObjectLiteralExpression(valueNode)) {
      findDuplicateKeys(sourceFile, valueNode, key, position(sourceFile, valueNode));
      for (const property of valueNode.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const nextKey = key ? `${key}.${propertyName(sourceFile, property.name)}` : propertyName(sourceFile, property.name);
        visit(property.initializer, nextKey);
      }
      return;
    }

    if (ts.isArrayLiteralExpression(valueNode)) {
      valueNode.elements.forEach((element, index) => visit(element, `${key}.${index}`));
      return;
    }

    if (ts.isStringLiteral(valueNode) || ts.isNoSubstitutionTemplateLiteral(valueNode)) {
      set(key, valueNode.text, valueNode);
      return;
    }

    if (valueNode.kind === ts.SyntaxKind.NullKeyword) {
      set(key, "null", valueNode);
      return;
    }

    if (ts.isIdentifier(valueNode) && ["undefined", "NaN"].includes(valueNode.text)) {
      set(key, valueNode.text, valueNode);
      return;
    }

    set(key, "__present__", valueNode);
  }

  visit(node, prefix);
  return values;
}

function objectToLanguageEntries(sourceFile, objectLiteral) {
  const entries = new Map();
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(sourceFile, property.name);
    if (languageSet.has(key)) {
      entries.set(key, property.initializer);
    }
  }
  return entries;
}

function validateFlatValues(flatValues, label, language) {
  for (const [key, item] of flatValues.entries()) {
    leafKeysChecked += 1;
    if (typeof item.value !== "string" || item.value === "__present__") continue;
    const trimmed = item.value.trim();
    if (!trimmed) {
      failures.push(`${label}: ${language}.${key} is empty.`);
    }
    if (placeholderPattern.test(trimmed)) {
      failures.push(`${label}: ${language}.${key} contains placeholder value "${item.value}".`);
    }
    if (leakedKeyPattern.test(trimmed)) {
      failures.push(`${label}: ${language}.${key} looks like an untranslated key "${item.value}".`);
    }
  }
}

function compareLanguageMap(sourceFile, name, entries, options = {}) {
  const label = `${name} (${position(sourceFile, options.node ?? sourceFile)})`;
  const allowFallback = Boolean(options.allowFallback);
  const allowPartial = Boolean(options.allowPartial);
  const unresolvedSpread = Boolean(options.unresolvedSpread);
  const objectEntries = [...entries.values()].filter((node) => ts.isObjectLiteralExpression(node));
  const preferredReference = entries.get(referenceLanguage);
  const referenceNode =
    preferredReference && ts.isObjectLiteralExpression(preferredReference)
      ? preferredReference
      : entries.get("ru") && ts.isObjectLiteralExpression(entries.get("ru"))
        ? entries.get("ru")
        : objectEntries[0] ?? preferredReference ?? entries.values().next().value;
  const completeLanguageCoverage = languages.every((language) => entries.has(language));
  const canCompareDeepKeys = Boolean(referenceNode && ts.isObjectLiteralExpression(referenceNode));

  if (!referenceNode) {
    failures.push(`${label}: no reference language found.`);
    return;
  }

  dictionariesChecked += 1;
  const referenceFlat = flattenValue(sourceFile, referenceNode);
  validateFlatValues(referenceFlat, label, referenceLanguage);

  for (const language of languages) {
    let languageNode = entries.get(language);
    if (!languageNode) {
      if ((allowFallback || allowPartial || !completeLanguageCoverage || unresolvedSpread) && entries.has(referenceLanguage)) {
        languageNode = referenceNode;
        fallbackGeneratedKeys += referenceFlat.size;
        warnings.push(`${label}: ${language} is generated from ${referenceLanguage} fallback or unresolved partial map.`);
      } else if (allowFallback || allowPartial || !completeLanguageCoverage || unresolvedSpread) {
        warnings.push(`${label}: ${language} is not present in this partial map.`);
        continue;
      } else {
        failures.push(`${label}: missing language "${language}".`);
        continue;
      }
    }

    const languageFlat = flattenValue(sourceFile, languageNode);
    validateFlatValues(languageFlat, label, language);

    if (!canCompareDeepKeys || !ts.isObjectLiteralExpression(languageNode)) {
      if (!canCompareDeepKeys && language === referenceLanguage) {
        warnings.push(`${label}: deep key comparison skipped because the reference language is computed.`);
      }
      continue;
    }

    for (const key of referenceFlat.keys()) {
      if (isArrayShapeKey(key)) continue;
      if (!languageFlat.has(key)) {
        const message = `${label}: ${language}.${key} is missing.`;
        if (completeLanguageCoverage && !allowFallback && !allowPartial && !unresolvedSpread) {
          failures.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    for (const key of languageFlat.keys()) {
      if (isArrayShapeKey(key)) continue;
      if (!referenceFlat.has(key)) {
        warnings.push(`${label}: ${language}.${key} exists but is not present in ${referenceLanguage}.`);
      }
    }
  }
}

function compareNestedLanguageMap(sourceFile, name, objectLiteral, allowFallback) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue;
    const nestedName = `${name}.${propertyName(sourceFile, property.name)}`;
    compareLanguageMap(sourceFile, nestedName, objectToLanguageEntries(sourceFile, property.initializer), {
      allowFallback,
      node: property.initializer,
      unresolvedSpread: hasSpread(sourceFile, property.initializer)
    });
  }
}

function inspectInitializer(sourceFile, name, initializer) {
  if (/(?:Slug|Aliases|baseProText|extraProText|serviceExtrasBase|localizedExtra)/.test(name)) {
    return;
  }

  if (ts.isObjectLiteralExpression(initializer) && isLanguageMap(sourceFile, initializer)) {
    compareLanguageMap(sourceFile, name, objectToLanguageEntries(sourceFile, initializer), {
      node: initializer,
      allowPartial: /setupText/.test(name),
      unresolvedSpread: hasSpread(sourceFile, initializer)
    });
    return;
  }

  if (!ts.isCallExpression(initializer)) return;
  const nameOfCall = callName(sourceFile, initializer.expression);
  const [firstArg] = initializer.arguments;

  if (
    ["withEnglishFallback", "withExtraLanguageFallbacks"].includes(nameOfCall) &&
    firstArg &&
    ts.isObjectLiteralExpression(firstArg)
  ) {
    compareLanguageMap(sourceFile, name, objectToLanguageEntries(sourceFile, firstArg), {
      allowFallback: true,
      node: firstArg,
      unresolvedSpread: hasSpread(sourceFile, firstArg)
    });
  }

  if (
    ["withNestedEnglishFallback", "withNestedExtraLanguageFallbacks"].includes(nameOfCall) &&
    firstArg &&
    ts.isObjectLiteralExpression(firstArg)
  ) {
    compareNestedLanguageMap(sourceFile, name, firstArg, true);
  }
}

function inspectFile(file) {
  const sourceFile = parseSource(file);

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      inspectInitializer(sourceFile, node.name.text, node.initializer);
    }

    if (ts.isCallExpression(node) && callName(sourceFile, node.expression) === "Object.assign") {
      const [target, patch] = node.arguments;
      if (target && patch && ts.isObjectLiteralExpression(patch) && isLanguageMap(sourceFile, patch)) {
        compareLanguageMap(sourceFile, `${target.getText(sourceFile)}.Object.assign`, objectToLanguageEntries(sourceFile, patch), {
          allowFallback: true,
          node: patch,
          unresolvedSpread: hasSpread(sourceFile, patch)
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

for (const file of sourceFiles) {
  inspectFile(file);
}

if (!dictionariesChecked) {
  failures.push("No localization dictionaries were detected.");
}

const report = {
  languages,
  referenceLanguage,
  filesScanned: sourceFiles.length,
  dictionariesChecked,
  leafKeysChecked,
  fallbackGeneratedKeys,
  missingOrInvalid: failures.length,
  warnings: warnings.length
};

console.log("i18n QA report:");
console.log(JSON.stringify(report, null, 2));

if (warnings.length) {
  console.log("i18n QA warnings:");
  for (const warning of warnings.slice(0, 80)) {
    console.log(`- ${warning}`);
  }
  if (warnings.length > 80) {
    console.log(`- ... ${warnings.length - 80} more warnings`);
  }
}

if (failures.length) {
  console.error("i18n QA failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("i18n QA passed.");
