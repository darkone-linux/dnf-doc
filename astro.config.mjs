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
      // Explicit sidebar: controls section order, keeps menu labels SHORT and
      // localized, and avoids the raw folder-name groups that `autogenerate`
      // over `doc/` would produce. Order: introduction → user → admin → dev →
      // FAQ. Per-leaf short labels live in each page's `sidebar.label`.
      sidebar: [
        {
          label: "Documentation",
          translations: { fr: "Documentation" },
          items: [
            {
              slug: "doc/introduction",
              label: "Introduction",
              translations: { fr: "Introduction" },
            },
            {
              label: "User Guide",
              translations: { fr: "Guide de l'utilisateur" },
              collapsed: true,
              // The "presentation" leaves (services, workstations, profiles,
              // nodes) live under doc/user-guide/presentation/ and stay OFF the
              // sidebar — reached from the overview cards. Only the overview and
              // the day-to-day "manage my account" page are listed here.
              items: [
                {
                  slug: "doc/user-guide",
                  label: "Overview",
                  translations: { fr: "Présentation" },
                },
                { slug: "doc/user-guide/account" },
              ],
            },
            {
              label: "Administrators",
              translations: { fr: "Administrateurs" },
              collapsed: true,
              items: [
                {
                  slug: "doc/admin-guide",
                  label: "Overview",
                  translations: { fr: "Présentation" },
                },
                { autogenerate: { directory: "doc/admin-guide" } },
              ],
            },
            {
              label: "Developers",
              translations: { fr: "Développeurs" },
              collapsed: true,
              items: [
                {
                  slug: "doc/dev-guide",
                  label: "Overview",
                  translations: { fr: "Présentation" },
                },
                { autogenerate: { directory: "doc/dev-guide" } },
              ],
            },
            // FAQ: two coherent levels — overview + one landing page per
            // persona. The individual how-to leaves stay off the sidebar
            // (reachable from each persona page). Labels come from each page's
            // localized `sidebar.label`.
            {
              label: "FAQ",
              translations: { fr: "FAQ" },
              collapsed: true,
              items: [
                { slug: "doc/how-to" },
                { slug: "doc/how-to/user" },
                { slug: "doc/how-to/admin" },
                { slug: "doc/how-to/dev" },
              ],
            },
          ],
        },
        {
          label: "References",
          translations: { fr: "Références" },
          items: [{ autogenerate: { directory: "ref" } }],
        },
        { label: "Changelog", slug: "changelog" },
        { label: "Thanks!", slug: "thanks" },
      ],
    }),
  ],
});
