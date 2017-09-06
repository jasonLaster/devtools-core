/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { getOriginalURLs } = require("../source-map");
const { getLocationScopes } = require("../scopes");
const { SourceMapGenerator } = require("source-map");

function getMap(_path) {
    const mapPath = path.join(__dirname, _path);
    return fs.readFileSync(mapPath, "utf8");
}

jest.mock("devtools-utils/src/network-request");

test("getLocationScopes", async() => {
    const source = {
        id: "scopes.js",
        sourceMapURL: "scopes.js.map",
        url: "http://example.com/scopes.js"
    };


    await getOriginalURLs(source);
    const bindings = await getBindings(source.id)

    // The generated source predends to have two scopes and the `zero` and `one`
    // variables were changes to `z` and `o` respectively.

    // Testing two scopes. The location of interest located somewhere at
    // `... { /* here */ let one = 1 ...`.
    const mapped1 = await getLocationScopes({ sourceId: source.id, line: 11, column: 13 }, bindings);

    expect(mapped1).toEqual([
        { "bindings": { "one": "o" }, "type": "block" },
        { "bindings": { "zero": "z" }, "type": "function" }
    ]);

    // Testing outer scope. The location of interest located somewhere at
    // `... one++; } zero = 0; /* here */ }`.
    const mapped2 = await getLocationScopes({ sourceId: source.id, line: 21, column: 5 }, bindings);
    expect(mapped2).toEqual([
        { "bindings": { "zero": "z" }, "type": "function" }
    ]);

    // Testing non-existent binding that appeared in the generated code.
    const mapped3 = await getLocationScopes({ sourceId: source.id, line: 21, column: 5 }, bindigns);
    expect(mapped3).toEqual([
        { "bindings": {}, "type": "function" }
    ]);
});