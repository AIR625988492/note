const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const Visualizer = require('webpack-visualizer-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const { getIfUtils, removeEmpty } = require('webpack-config-utils')
const { ifProduction } = getIfUtils(process.env.NODE_ENV || 'development')

/**
 * 派生 Webpack 全局配置参数项
 *
 * @param webpackConfig.entry - 待打包的源代码文件配置项
 * @param webpackConfig.distPath - 生成文件所在目录的路径 默认值: dist
 * @param webpackConfig.chunkhash - 启用 chunkhash 文件命名 默认值: FASLE
 * @param webpackConfig.localident - 启用 localIdentName 模式 默认值: FALSE
 * @param webpackConfig.theme - 主题样式全局配置参数项 默认值: {}
 * @return Webpack 配置参数项
 */
module.exports = function (webpackConfig) {
  if (!webpackConfig.entry) {
    throw new Error('webpackConfig.entry must not be empty')
  }

  const srcPath = path.join(__dirname, 'src')
  const distPath = path.join(__dirname, webpackConfig.distPath || 'dist')

  if (typeof webpackConfig.entry === 'string') {
    webpackConfig.entry = {
      main: webpackConfig.entry
    }
  }

  for (let name of Object.keys(webpackConfig.entry)) {
    webpackConfig.entry[name] = path.join(srcPath, webpackConfig.entry[name])
  }

  const jsFilename = webpackConfig.chunkhash
    ? 'js/[name].[chunkhash].js'
    : 'js/[name].min.js'
  const cssFilename = webpackConfig.chunkhash
    ? 'css/[name].[chunkhash].css'
    : 'css/[name].min.css'
  const cfgFonts = webpackConfig.chunkhash
    ? '&outputPath=fonts/&publicPath=../fonts'
    : '&outputPath=fonts/&publicPath=../fonts&name=[name].[ext]'
  const cfgLocalIdent = webpackConfig.localident === false
    ? ''
    : '&modules&localIdentName=_[hash:base64]'
  const cfgThemeLess = typeof webpackConfig.theme === 'object'
    ? webpackConfig.theme
    : {}

  let cfgThemeSass = []
  for (const variable of Object.keys(cfgThemeLess)) {
    cfgThemeSass.push('$' + variable + ':' + cfgThemeLess[variable])
  }

  return {
    entry: webpackConfig.entry || {},
    target: 'electron-renderer',
    output: {
      path: distPath,
      filename: jsFilename,
      chunkFilename: jsFilename
    },
    resolve: {
      modules: webpackConfig.resolveModules || ['node_modules'],
      extensions: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.vue',
        '.css',
        '.less',
        '.scss',
        '.html',
        '.json'
      ],
      alias: {
        'vue$': 'vue/dist/vue.common.js'
      }
    },
    externals: webpackConfig.externals || {},
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.tsx?$/,
          use: [
            'babel-loader',
            'awesome-typescript-loader'
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader?presets=es2015',
          exclude: /node_modules/
        },
        {
          test: /\.jsx$/,
          loader: 'babel-loader'
        },
        {
          test: function (file) {
            return /\.css$/.test(file) && !/\.module\.css$/.test(file)
          },
          loader: ExtractTextPlugin.extract([
            `css-loader?sourceMap${cfgLocalIdent}&import&url`,
            'postcss-loader'
          ])
        },
        {
          test: /\.module\.css$/,
          loader: ExtractTextPlugin.extract([
            'css-loader?sourceMap&import&url',
            'postcss-loader'
          ])
        },
        {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract([
            `css-loader?sourceMap${cfgLocalIdent}&import&url`,
            'postcss-loader',
            `less-loader?{'modifyVars':${JSON.stringify(cfgThemeLess)}}`
          ])
        },
        {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract([
            `css-loader?sourceMap${cfgLocalIdent}&import&url`,
            'postcss-loader',
            `sass-loader?{'data':'${cfgThemeSass.join('')}'}`
          ])
        },
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          loader: `url-loader?limit=100000&minetype=application/font-woff${cfgFonts}`
        },
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
          loader: `url-loader?limit=100000&minetype=application/font-woff${cfgFonts}`
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          loader: `url-loader?limit=100000&minetype=application/octet-stream${cfgFonts}`
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          loader: `url-loader?limit=100000&minetype=application/application/vnd.ms-fontobject${cfgFonts}`
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          loader: `url-loader?limit=100000&minetype=image/svg+xml${cfgFonts}`
        },
        {
          test: /\.(png|jpg|jpeg|gif)(\?v=\d+\.\d+\.\d+)?$/,
          loader: 'url-loader?limit=100000'
        },
        {
          test: /\.json$/,
          loader: 'url-loader?limit=100000'
        }
      ]
    },
    plugins: removeEmpty([
      /*new HtmlWebpackPlugin({
        template: path.join(srcPath, 'index.html'),
        filename: 'index.html',
        minify: {
          html5: true,
          collapseWhitespace: true
        }
      }),*/
      new webpack.LoaderOptionsPlugin({
        minimize: process.env.NODE_ENV === 'production',
        debug: process.env.NODE_ENV !== 'production',
        options: {
          'html-minify-loader': {}
        }
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'production': process.env.NODE_ENV === 'production',
          'electron': process.env.NODE_RUNTIME === 'electron'
        }
      }),
      new ExtractTextPlugin({
        filename: cssFilename,
        disable: false,
        allChunks: true
      }),
      new CaseSensitivePathsPlugin(),
      /*new CopyWebpackPlugin([
        {
          from: path.join(srcPath, 'assets'),
          to: distPath
        }
      ]),*/
      ifProduction(new Visualizer()),
      ifProduction(new webpack.optimize.OccurrenceOrderPlugin(false)),
      ifProduction(new UglifyJSPlugin({
        uglifyOptions: {
          compress: {
            warnings: false,
            conditionals: true,
            unused: true,
            comparisons: true,
            sequences: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true
          },
          output: {
            comments: false
          }
        }
      }))
    ]),
    devServer: {
      contentBase: __dirname,
      host: '0.0.0.0',
      port: 8000
    }
  }
}
