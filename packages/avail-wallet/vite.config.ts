import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    dts({ rollupTypes: true }),
  ],
  optimizeDeps: {
    include: ["avail-js-sdk"],
  },

  build: {
    lib: {
      entry: {
        "avail-wallet": path.resolve(__dirname, "src/lib/index.ts"),
        utils: path.resolve(__dirname, "src/lib/utils.ts"),
        types: path.resolve(__dirname, "src/types/index.ts"),
      },
      name: "avail-wallet",
    },
    commonjsOptions: {
      include: [/avail-js-sdk/, /node_modules/],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
      },
    },
  },
});
