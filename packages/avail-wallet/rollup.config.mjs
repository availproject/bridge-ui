import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";
import copy from "rollup-plugin-copy";

import packageJson from "./package.json" assert { type: "json" };

export default {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    // Handle CSS
    postcss({
      extensions: [".css"],
      minimize: true,
      extract: "styles.css",
    }),
    // Handle images and other assets
    url({
      include: ["**/*.png", "**/*.jpg", "**/*.svg"],
      limit: 0, // Always emit as separate files
    }),
    // Copy font files to dist
    copy({
      targets: [
        {
          src: "src/assets/fonts/*",
          dest: "dist/assets/fonts",
        },
        {
          src: "src/assets/images/*",
          dest: "dist/assets/images",
        },
      ],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      exclude: ["**/__tests__", "**/*.test.ts"],
      declaration: true,
      declarationDir: "./dist/types",
    }),
  ],
  external: [
    "react",
    "react-dom",
    "avail-js-sdk",
    "@talismn/connect-wallets",
    "zustand",
    "react-cookie",
  ],
};
