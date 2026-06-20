// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [solid()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
