const path = require('path')
const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',

  entry: {
    index: './src/index.js',
    graphRenderer: './src/reactComponents/graphRenderer.js',
    sankeyRenderer: './src/reactComponents/sankeyRenderer.js',
  },

  output: {
    filename: '[name].js',
    // path: path.resolve(__dirname, '../widgets/dist'),
    // path: path.resolve(__dirname, '../explorer/app/javascript/packs'),
    path: path.resolve(__dirname, 'dist'),
    library: 'graphs',
    libraryTarget: 'umd',
  },

  externals: {
    jquery: {
      commonjs: 'jquery',
      commonjs2: 'jquery',
      amd: 'jquery',
      var: '$',
		},
		react: {
			root: "React",
			commonjs2: "react",
			commonjs: "react",
			amd: "react",
			umd: "react",
		},
		"react-dom": {
			root: "ReactDOM",
			commonjs2: "react-dom",
			commonjs: "react-dom",
			amd: "react-dom",
			umd: "react-dom",
		},
		// 'react': 'commonjs react', 'react-dom': 'commonjs react-dom',
    // React: {
    //   commonjs: 'React',
    //   commonjs2: 'React',
    //   amd: 'React',
    //   var: 'React',
    // },
    // ReactDOM: {
    //   commonjs: 'ReactDOM',
    //   commonjs2: 'ReactDOM',
    //   amd: 'ReactDOM',
    //   var: 'ReactDOM',
    // },
  },

  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({ filename: 'graphs.min.css' }),
  ],

  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader',
      },
      {
        test: /.(scss|css)$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',

            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',

            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimize: false,
    // minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        cache: true,
        sourceMap: true,
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin({
        sourceMap: true,
      }),
    ],
  },
}
