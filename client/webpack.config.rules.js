const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function () {
  return [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: "babel-loader",
    },
    {
      test: /\.(jpe?g|png|gif|svg|eot|ttf|woff|woff2)$/i,
      type: "asset/resource",
      generator: {
        filename: "assets/[name]-[hash][ext]",
      },
    },
    {
      test: /\.html$/i,
      loader: "html-loader",
    },
    {
      test: /\.(scss|css)$/i,
      use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
    },
  ];
};
