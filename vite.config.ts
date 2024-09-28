/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import { replaceCodePlugin } from 'vite-plugin-replace';
import Path from "path"

import viteCopyEsm from './viteCopyEsm';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    build: {
      outDir: 'build',
      rollupOptions: {
        input: {
          main: new URL('./index.html', import.meta.url).pathname,
          split: new URL('./split/index.html', import.meta.url).pathname,
        },
        onwarn(warning, warn) {
          if (
            warning.code === 'EVAL' &&
            warning.id &&
            /[\\/]node_modules[\\/]@excalidraw\/excalidraw[\\/]/.test(
              warning.id,
            )
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    define: {
      'process.env.IS_PREACT': process.env.IS_PREACT,
    },
    plugins: [
      replaceCodePlugin({
        replacements: [
          {
            from: /__DEV__/g,
            to: 'true',
          },
          {
            from: 'process.env.LEXICAL_VERSION',
            to: JSON.stringify(`${process.env.npm_package_version}+git`),
          },
        ],
      }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        exclude: '/**/node_modules/**',
        extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
        plugins: [
          '@babel/plugin-transform-flow-strip-types',
        ],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      }),
      react(),
      viteCopyEsm(),
      commonjs({
        // This is required for React 19 (at least 19.0.0-beta-26f2496093-20240514)
        // because @rollup/plugin-commonjs does not analyze it correctly
        strictRequires: [/\/node_modules\/(react-dom|react)\/[^/]\.js$/],
      }),
    ],
    resolve: {
      alias: {
        "shared": Path.resolve(__dirname, "./src/shared"),
      }
    },
  };
});