/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {
    getOriginalURLs,
    getGeneratedLocation,
    getOriginalLocation,
    getOriginalSourceText,
    hasMappedSource,
    applySourceMap,
    clearSourceMaps
} = require("./source-map");
const { getLocationScopes } = require("devtools-map-bindings");

const { workerUtils: { workerHandler } } = require("devtools-utils");

// The interface is implemented in source-map to be
// easier to unit test.
self.onmessage = workerHandler({
    getOriginalURLs,
    getGeneratedLocation,
    getOriginalLocation,
    getLocationScopes,
    getOriginalSourceText,
    hasMappedSource,
    applySourceMap,
    clearSourceMaps
})