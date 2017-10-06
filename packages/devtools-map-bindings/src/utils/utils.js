// @flow

import type { MappedScopeBindings } from "debugger-html";

function replaceOriginalVariableName(
  expression: string,
  generatedScopes: MappedScopeBindings[]
): string {
  // JavaScript indetifier is a complex thing: it can contain '$', '\', ZWJ, any
  // unicode letter or number. Simplifing that to latin character set for now.
  // For simplicity, search only first characters of the expression to find an
  // identifier/variable name.
  const possibleVarNameRegex = /^([$\w]+)/;
  const matchedVarName = possibleVarNameRegex.exec(expression);
  if (!matchedVarName) {
    return expression;
  }

  const originalName = matchedVarName[1];
  // The generatedScopes sorted in inner-to-outer scope order, finding first.
  const foundScope = generatedScopes.find(
    ({ bindings }) => originalName in bindings
  );
  if (!foundScope) {
    return expression;
  }

  // Replace original name (which will be at the beginning of the expression)
  // with found generated name.
  const generatedName = foundScope.bindings[originalName];
  const expressionWoOriginalName = expression.substring(originalName.length);
  return `${generatedName}${expressionWoOriginalName}`;
}


function replaceOriginalVariables()

module.exports = { replaceOriginalVariableName };
