/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { getSource, parseScopes } = require("./helpers");
const babylon = require("babylon");
const { default: traverse } = require("babel-traverse");
import * as t from "babel-types";

import type { Source, Location, SourceScope } from "debugger-html";

function traverseAst(source, visitor) {
  const code = source.text;
  const ast = babylon.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "flow", "objectRestSpread"]
  });

  traverse(ast, visitor);
}

function getMappedScopes(fixture, location) {
  const source = getSource();
  const location = {
    sourceId: source.id,
    ...location
  };
  const scopes = parseScopes(location, source);

  const map = getSourceMap(source);
  const mappedScopes = getLocationScopes(map, scopes, location);
}

describe("mapIdentifiers", () => {
  it("simple", () => {
    const mappedScopes = getMappedScopes("sum.min", {
      line: 1,
      column: 27
    });

    const map = expr => mapIdentifiers(expr, mappedScopes, { traverseAst, t });

    expect(map("first")).toEqual("n");
    expect(map("first*2")).toEqual("n*2");
    expect(map("first*first")).toEqual("n*n");
  });
});
