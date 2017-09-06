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

    require("devtools-utils/src/network-request").mockImplementationOnce(() => {
        const content = getMap("fixtures/scopes.js.map");
        return { content };
    });

    // // Testing something like:
    // // `function () { var zero; { let one = 1; one++; } zero = 0; }`
    // require("devtools-utils/src/network-request").mockImplementationOnce(() => {
    //     var map = new SourceMapGenerator({
    //         file: "source-mapped.js"
    //     });

    //     map.addMapping({
    //         generated: {
    //             line: 1,
    //             column: 3
    //         },
    //         source: "foo.js",
    //         original: {
    //             line: 1,
    //             column: 1
    //         },
    //         name: "zero"
    //     });

    //     map.addMapping({
    //         generated: {
    //             line: 11,
    //             column: 15
    //         },
    //         source: "foo.js",
    //         original: {
    //             line: 33,
    //             column: 5
    //         },
    //         name: "one"
    //     });

    //     map.addMapping({
    //         generated: {
    //             line: 11,
    //             column: 35
    //         },
    //         source: "foo.js",
    //         original: {
    //             line: 33,
    //             column: 9
    //         },
    //         name: "one"
    //     });

    //     map.addMapping({
    //         generated: {
    //             line: 20,
    //             column: 5
    //         },
    //         source: "foo.js",
    //         original: {
    //             line: 50,
    //             column: 1
    //         },
    //         name: "zero"
    //     });

    //     const content = map.toString();
    //     return { content };
    // });

    await getOriginalURLs(source);

    // The generated source predends to have two scopes and the `zero` and `one`
    // variables were changes to `z` and `o` respectively.

    // Testing two scopes. The location of interest located somewhere at
    // `... { /* here */ let one = 1 ...`.
    const mapped1 = await getLocationScopes({ sourceId: source.id, line: 11, column: 13 }, [{
            type: "block",
            start: { sourceId: source.id, line: 30, column: 1 },
            end: { sourceId: source.id, line: 39, column: 1 },
            bindings: {
                o: [
                    { sourceId: source.id, line: 11, column: 15 },
                    { sourceId: source.id, line: 11, column: 33 }
                ]
            }
        },
        {
            type: "function",
            start: { sourceId: source.id, line: 1, column: 1 },
            end: { sourceId: source.id, line: 21, column: 1 },
            bindings: {
                z: [
                    { sourceId: source.id, line: 1, column: 3 },
                    { sourceId: source.id, line: 20, column: 5 }
                ]
            }
        }
    ]);

    expect(mapped1).toEqual([
        { "bindings": { "one": "o" }, "type": "block" },
        { "bindings": { "zero": "z" }, "type": "function" }
    ]);

    // Testing outer scope. The location of interest located somewhere at
    // `... one++; } zero = 0; /* here */ }`.
    const mapped2 = await getLocationScopes({ sourceId: source.id, line: 21, column: 5 }, [{
        type: "function",
        start: { sourceId: source.id, line: 1, column: 1 },
        end: { sourceId: source.id, line: 21, column: 1 },
        bindings: {
            z: [
                { sourceId: source.id, line: 1, column: 3 },
                { sourceId: source.id, line: 20, column: 5 }
            ]
        }
    }]);
    expect(mapped2).toEqual([
        { "bindings": { "zero": "z" }, "type": "function" }
    ]);

    // Testing non-existent binding that appeared in the generated code.
    const mapped3 = await getLocationScopes({ sourceId: source.id, line: 21, column: 5 }, [{
        type: "function",
        start: { sourceId: source.id, line: 1, column: 1 },
        end: { sourceId: source.id, line: 21, column: 1 },
        bindings: {
            n: [
                { sourceId: source.id, line: 1, column: 31 },
                { sourceId: source.id, line: 20, column: 51 }
            ]
        }
    }]);
    expect(mapped3).toEqual([
        { "bindings": {}, "type": "function" }
    ]);
});