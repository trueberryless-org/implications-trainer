// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/": "/en/",
  },

  adapter: node({
    mode: "standalone",
  }),
});