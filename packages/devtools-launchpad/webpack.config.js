/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

require("babel-register");

const path = require("path");

const webpack = require("webpack");
const { NormalModuleReplacementPlugin } = require("webpack");

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const {
  isDevelopment,
  isFirefoxPanel,
  getValue,
  setConfig
} = require("devtools-config");
const NODE_ENV = process.env.NODE_ENV || "development";
const TARGET = process.env.TARGET || "local";

module.exports = (webpackConfig, envConfig, options = {}) => {
  setConfig(envConfig);

  webpackConfig.context = path.resolve(__dirname, "src");
  webpackConfig.devtool = "source-map";

  webpackConfig.module = webpackConfig.module || {};
  webpackConfig.module.rules = webpackConfig.module.rules || [];
  webpackConfig.module.rules.push({
    test: /\.json$/,
    loader: "json-loader"
  });

  webpackConfig.module.rules.push({
    test: /\.js$/,
    exclude: request => {
      // Some paths are excluded from Babel
      let excludedPaths = ["fs", "node_modules"];
      let excludedRe = new RegExp(`(${excludedPaths.join("|")})`);
      let excluded = !!request.match(excludedRe);

      if (options && options.babelExcludes) {
        // If the tool defines an additional exclude regexp for Babel.
        excluded = excluded || !!request.match(options.babelExcludes);
      }
      return excluded && !request.match(/node_modules(\/|\\)devtools-/);
    },
    loader: `babel-loader?ignore=src/lib`
  });

  webpackConfig.module.rules.push({
    test: /\.properties$/,
    loader: "raw-loader"
  });

  webpackConfig.node = { fs: "empty" };

  webpackConfig.plugins = webpackConfig.plugins || [];
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(NODE_ENV),
        TARGET: JSON.stringify(TARGET)
      },
      DebuggerConfig: JSON.stringify(envConfig)
    })
  );

  if (isDevelopment()) {
    /*
     * SVGs are loaded in one of two ways in JS w/ SVG inline loader
     * and in CSS w/ the CSS loader.
     *
     * Inline SVGs are included in the JS bundle and mounted w/ React.
     *
     * SVG URLs like chrome://devtools/skin/images/arrow.svg are mapped
     * by the postcss-loader to /mc/devtools/client/themes/arrow.svg
     * and are hosted in `development-server` with an express server.
     *
     * CSS URLs like resource://devtools/client/themes/variables.css are mapped
     * by the NormalModuleReplacementPlugin to devtools-mc-assets/assets/devtools/client/themes/arrow.svg.
     * The modules are then resolved by the css-loader, which allows modules like
     * variables.css to be bundled.
     *
     * We use several PostCSS plugins to make local development a little easier:
     * autoprefixer, bidirection. These plugins help support chrome + firefox
     * development w/ new CSS features like RTL, mask, ...
     */

    webpackConfig.module.rules.push({
      test: /svg$/,
      loader: "svg-inline-loader"
    });

    webpackConfig.module.rules.push({
      test: /\.css$/,
      use: [
        { loader: "style-loader" },
        {
          loader: "css-loader",
          options: {
            importLoaders: 1,
            url: false
          }
        },
        {
          loader: "postcss-loader"
        }
      ]
    });

    webpackConfig.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /(resource:|chrome:).*.css/,
        function(resource) {
          const newUrl = resource.request
            .replace(
              /(.\/chrome:\/\/|.\/resource:\/\/)/,
              `devtools-mc-assets/assets/`
            )
            .replace(/devtools\/skin/, "devtools/client/themes")
            .replace(/devtools\/content/, "devtools/client");

          resource.request = newUrl;
        }
      )
    );
  } else {
    /*
    * SVGs are loaded in one of two ways in JS w/ SVG inline loader
    * and in CSS w/ the CSS loader.
    *
    * Inline SVGs are included in the JS bundle and mounted w/ React.
    *
    * SVG URLs like /images/arrow.svg are mapped
    * by the postcss-loader to chrome://chrome://devtools/skin/images/debugger/arrow.svg,
    * copied to devtools/themes/images/debugger and added to the jar.mn
    *
    * SVG URLS like chrome://devtools/skin/images/add.svg are
    * ignored as they are already available in MC.
    */
    // Extract CSS into a single file
    webpackConfig.module.rules.push({
      test: /\.css$/,
      exclude: request => {
        // If the tool defines an exclude regexp for CSS files.
        return (
          webpackConfig.cssExcludes && request.match(webpackConfig.cssExcludes)
        );
      },
      use: ExtractTextPlugin.extract({
        filename: "*.css",
        use: [
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              url: false
            }
          },
          { loader: "postcss-loader" }
        ]
      })
    });

    webpackConfig.module.rules.push({
      test: /svg$/,
      loader: "svg-inline-loader"
    });

    webpackConfig.plugins.push(new ExtractTextPlugin("[name].css"));
  }

  if (isFirefoxPanel()) {
    webpackConfig = require("./webpack.config.devtools")(
      webpackConfig,
      envConfig,
      options
    );
  }

  // NOTE: This is only needed to fix a bug with chrome devtools' debugger and
  // destructuring params https://github.com/devtools-html/debugger.html/issues/67
  if (getValue("transformParameters")) {
    webpackConfig.module.rules.forEach(spec => {
      if (spec.isJavaScriptLoader) {
        const idx = spec.rules.findIndex(loader =>
          loader.includes("babel-loader")
        );
        spec.rules[idx] += "&plugins[]=transform-es2015-parameters";
      }
    });
  }

  return webpackConfig;
};
