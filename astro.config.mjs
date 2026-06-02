import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import rehypeExternalLinks from "rehype-external-links";
import { targetBlank } from "./src/plugins/targetBlank";

// https://astro.build/config
export default defineConfig({
  site: "https://darkone-linux.github.io",
  trailingSlash: "always",
  build: {
    assets: "astro",
  },
  markdown: {
    rehypePlugins: [
      [targetBlank, { domain: "darkone-linux.github.io" }],
      [
        rehypeExternalLinks,
        {
          content: { type: "text", value: "\u{00A0}\u{1F855}" },
        },
      ],
    ],
  },
  redirects: {
    "/": "/en/",
  },
  integrations: [
    starlight({
      // Fail the build on any dead internal link or #anchor. Cross-language
      // links (an EN-only page referenced from FR) are intentional here, so
      // inconsistent-locale links are allowed.
      plugins: [
        starlightLinksValidator({
          errorOnInconsistentLocale: false,
        }),
      ],
      title: "Darkone NixOS Framework",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      defaultLocale: "en",
      locales: {
        en: {
          label: "English",
          lang: "en",
        },
        fr: {
          label: "Français",
          lang: "fr",
        },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/darkone-linux/darkone-nixos-framework",
        },
      ],
      logo: {
        src: "./src/assets/nix-logo.svg",
      },
      sidebar: [
        {
          label: "Documentation",
          items: [{ autogenerate: { directory: "doc" } }],
        },
        {
          label: "References",
          items: [{ autogenerate: { directory: "ref" } }],
        },
        { label: "Changelog", slug: "changelog" },
        { label: "Thanks!", slug: "thanks" },
      ],
    }),
  ],
});
