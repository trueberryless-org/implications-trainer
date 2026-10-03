import netlify from "@astrojs/netlify";
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: process.env["NETLIFY"] ? netlify() : node({ mode: "standalone" }),
  redirects: { "/": "/en/" },
  site: "https://implications-trainer.netlify.app",
});
