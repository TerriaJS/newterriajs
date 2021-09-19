var configureWebpackForTerriaJS = require("./configureWebpack");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var path = require("path");

module.exports = function() {
  const config = {
    mode: "development",
    entry: path.resolve(__dirname, "generateDocs.ts"),
    output: {
      path: path.resolve(__dirname, "..", "build"),
      filename: "generateDocs.js",
      sourcePrefix: "", // to avoid breaking multi-line string literals by inserting extra tabs.
      globalObject: "(self || window)" // to avoid breaking in web worker (https://github.com/webpack/webpack/issues/6642)
    },
    target: "node",
    resolve: {
      alias: {},
      modules: ["node_modules"],
      extensions: [".ts", ".js", ".jsx", ".tsx", ".json"]
    },
    externals: {
      vue: "vue",
      consolidate: "commonjs consolidate"
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "TerriaJS.css",
        disable: false,
        ignoreOrder: true
      })
    ]
  };
  return configureWebpackForTerriaJS(
    path.dirname(require.resolve("../package.json")),
    config,
    true,
    // devMode,
    // hot,
    false,
    MiniCssExtractPlugin
  );
};
