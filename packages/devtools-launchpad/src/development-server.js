#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require("babel-register");

const path = require("path");
const fs = require("fs");
const Mustache = require("mustache");
const webpack = require("webpack");
const express = require("express");
const serve = require("express-static");
const bodyParser = require("body-parser");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const checkNode = require("check-node-version");
const {
  setConfig,
  getConfig,
  updateLocalConfig,
  getValue,
  setValue
} = require("devtools-config");
const isDevelopment = require("devtools-config").isDevelopment;
const { handleLaunchRequest } = require("./server/launch");
const { handleNetworkRequest } = require("./server/networkRequest");
const NODE_VERSION = require("../package.json").engines.node;
let root;

function getFavicon() {
  let favicon = getValue("favicon");

  if (!favicon) {
    return "launchpad-favicon.png";
  }

  return path.basename(favicon);
}

function serveRoot(req, res) {
  const tplPath = path.join(__dirname, "../index.html");
  const tplFile = fs.readFileSync(tplPath, "utf8");
  const bundleName = getValue("title")
    ? getValue("title").toLocaleLowerCase()
    : "bundle";

  res.send(
    Mustache.render(tplFile, {
      isDevelopment: isDevelopment(),
      dir: getValue("dir") || "ltr",
      bundleName,
      title: getValue("title") || "Launchpad",
      favicon: getFavicon()
    })
  );
}

function handleGetConfig(req, res) {
  res.json(getConfig());
}

function handleSetConfig(req, res) {
  const params = req.body;
  setValue(params.path, params.value);
  const output = updateLocalConfig(root);

  res.end(output);
}

function onRequest(err, result) {
  const serverPort = getValue("development.serverPort");

  if (err) {
    console.log(err);
  } else {
    console.log(
      `Development Server Listening at http://localhost:${serverPort}`
    );
  }
}

function startDevServer(devConfig, webpackConfig, rootDir) {
  setConfig(devConfig);
  root = rootDir;
  checkNode(NODE_VERSION, (_, opts) => {
    if (!opts.nodeSatisfied) {
      const version = opts.node.raw;
      console.log(`Sorry, Your version of node is ${version}.`);
      console.log(`The minimum requirement is ${NODE_VERSION}`);
      process.exit();
    }
  });

  if (!getValue("firefox.webSocketConnection")) {
    const firefoxProxy = require("../bin/firefox-proxy");
    firefoxProxy({
      host: getValue("firefox.host"),
      webSocketPort: getValue("firefox.webSocketPort"),
      tcpPort: getValue("firefox.tcpPort"),
      logging: getValue("logging.firefoxProxy")
    });
  }

  // setup app
  const app = express();

  app.use(express.static("assets/build"));

  let favicon = getValue("favicon");
  let faviconDir = favicon
    ? path.dirname(path.join(rootDir, favicon))
    : path.join(__dirname, "../assets");

  app.use(express.static(faviconDir));

  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );

  app.use(bodyParser.json());

  if (!getValue("development.customIndex")) {
    app.get("/", serveRoot);
  }

  app.get("/get", handleNetworkRequest);
  app.post("/launch", handleLaunchRequest);
  app.get("/getconfig", handleGetConfig);
  app.post("/setconfig", handleSetConfig);

  const assetsPath = path.join(
    path.dirname(require.resolve("devtools-mc-assets", { basedir: __dirname })),
    "assets"
  );

  app.use("/mc", serve(assetsPath));
  app.use("/pad-assets", serve(path.join(__dirname, "../assets")));

  const serverPort = getValue("development.serverPort");
  app.listen(serverPort, "0.0.0.0", onRequest);

  const compiler = webpack(webpackConfig);
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
      noInfo: false,
      stats: "errors-only"
    })
  );

  if (getValue("hotReloading")) {
    app.use(webpackHotMiddleware(compiler));
  } else {
    console.log(
      "Hot Reloading - https://github.com/devtools-html/debugger.html/blob/master/docs/local-development.md#hot-reloading"
    );
  }

  return { express, app };
}

module.exports = {
  startDevServer
};
