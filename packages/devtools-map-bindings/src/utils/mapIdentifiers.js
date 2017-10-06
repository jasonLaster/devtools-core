function mapIdentifiers(
  expression,
  generatedScopes: MappedScopeBindings[],
  { traverseAst, t }
) {
  traverseAst(expression, {
    enter(path: NodePath) {
      if (t.isIdentifier(path)) {
      }
    }
  });
}
