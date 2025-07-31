const path = require('path');
const webpack = require('webpack');
module.exports = {
  mode: 'development', // Use 'production' for production builds
  entry: './src/webview/index.tsx', // Entry point for your app
  output: {
    path: path.resolve(__dirname, 'out'), // Output directory
    filename: 'bundle.js', // Output bundle file
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/, // Handle .js, .jsx, .ts, and .tsx files
        exclude: /node_modules|src\/test/, // Exclude dependencies
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env', // Transpile modern JavaScript (ES6+)
              '@babel/preset-react', // Transpile JSX for React
              '@babel/preset-typescript', // Transpile TypeScript
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader', // Injects styles into DOM
          'css-loader', // Turns CSS into CommonJS
          'sass-loader', // Compiles Sass to CSS
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg)$/, // Handle image files
        use: ['file-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // Automatically resolve these extensions
    fallback: {
      'process/browser': require.resolve('process/browser'), // Provide fallback for "process"
      buffer: require.resolve('buffer/'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser', // Make "process" globally available
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
