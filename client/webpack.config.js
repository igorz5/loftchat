const path = require("path");
const rules = require("./webpack.config.rules.js")();
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const DotEnv = require("dotenv-webpack");

module.exports = {
  entry: {
    index: "./src/index.js",
  },
  output: {
    filename: "[name].[hash].js",
    path: path.resolve("dist"),
  },
  devServer: {
    index: "index.html",
    overlay: true,
  },
  devtool: "source-map",
  module: {
    rules,
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: false,
          ecma: 6,
          mangle: true,
        },
        sourceMap: true,
      }),
    ],
  },
  plugins: [
    new HtmlPlugin({
      title: "Chat",
      template: "src/index.html",
    }),
    new MiniCssExtractPlugin(),
    new CleanWebpackPlugin(["dist"]),
    new DotEnv({
      systemvars: true,
    }),
  ],
};
