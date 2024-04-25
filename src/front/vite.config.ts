import path from "path"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        target: "esnext",
        minify: false,
    },
    plugins: [react()],
    define: {
        global: [],
    },
    resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
});
