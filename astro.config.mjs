import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import rehypeExternalLinks from "rehype-external-links";
import astroD2 from "astro-d2";
import { targetBlank } from "./src/plugins/targetBlank";
import { unified } from "@astrojs/markdown-remark";

// https://astro.build/config
export default defineConfig({
  site: "https://darkone-linux.github.io",
  trailingSlash: "always",
  build: {
    assets: "astro",
  },
  markdown: {
    processor: unified({
      remarkPlugins: [],
      rehypePlugins: [
        [targetBlank, { domain: "darkone-linux.github.io" }],
        [
          rehypeExternalLinks,
          {
            content: { type: "text", value: "\u{00A0}\u{1F855}" },
          },
        ],
      ],
    }),
  },
  redirects: {
    "/": "/fr/",
  },
  integrations: [
    // Diagrams: render ```d2 blocks to standalone SVG files (served from /d2/)
    // referenced via <img>, at build time. We use D2's NATIVE themes (light "0",
    // dark "200") so the semantic shapes (person, cylinder, …) keep their
    // distinct, legible look, with the hand-drawn `sketch` style as the house
    // aesthetic. <img> mode also carries each diagram's native width/height, so
    // SVGs render at their real size (no full-width stretch) with labels at
    // ~body text size. Dark mode follows the OS color-scheme (D2 embeds a
    // prefers-color-scheme media query). Requires `d2` on PATH (shell.nix).
    astroD2({
      inline: false,
      layout: "elk",
      sketch: true,
      pad: 20,
      theme: { default: "0", dark: "200" },
    }),
    starlight({
      // Fail the build on any dead internal link or #anchor. Cross-language
      // links (an EN-only page referenced from FR) are intentional here, so
      // inconsistent-locale links are allowed.
      plugins: [
        starlightLinksValidator({
          errorOnInconsistentLocale: false,
          // .starlight-links-validator/errors.json, read by `just build-fix`.
          reporters: { json: true },
        }),
      ],
      title: "Darkone NixOS Framework",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      defaultLocale: "fr",
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
          items: [
            {
              slug: "doc",
              label: "The Project",
              translations: { fr: "Le Projet" },
            },
            {
              label: "User Guide",
              translations: { fr: "Guide de l'utilisateur" },
              collapsed: true,
              items: [
                { slug: "doc/user-guide" },
                {
                  label: "Understand",
                  translations: { fr: "Comprendre" },
                  items: [
                    { autogenerate: { directory: "doc/user-guide/understand" } },
                  ],
                },
                {
                  label: "Use",
                  translations: { fr: "Utiliser" },
                  items: [
                    { autogenerate: { directory: "doc/user-guide/usage" } },
                  ],
                },
              ],
            },
            {
              label: "Administrators",
              translations: { fr: "Administrateurs" },
              collapsed: true,
              items: [
                { slug: "doc/admin-guide" },
                {
                  label: "Understand",
                  translations: { fr: "Comprendre" },
                  items: [
                    { autogenerate: { directory: "doc/admin-guide/understand" } },
                  ],
                },
                {
                  label: "Install",
                  translations: { fr: "Installer" },
                  items: [
                    { autogenerate: { directory: "doc/admin-guide/install" } },
                  ],
                },
                {
                  label: "Operate",
                  translations: { fr: "Exploiter" },
                  items: [
                    { autogenerate: { directory: "doc/admin-guide/operate" } },
                  ],
                },
                {
                  label: "Maintain",
                  translations: { fr: "Maintenir" },
                  items: [
                    { autogenerate: { directory: "doc/admin-guide/maintain" } },
                  ],
                },
              ],
            },
            {
              label: "Developers",
              translations: { fr: "Développeurs" },
              collapsed: true,
              items: [
                { autogenerate: { directory: "doc/dev-guide" } },
              ],
            },
            {
              label: "FAQ",
              collapsed: true,
              items: [
                {
                  label: "Users",
                  translations: { fr: "Utilisateurs" },
                  items: [
                    { autogenerate: { directory: "doc/how-to/user" } },
                  ],
                },
                {
                  label: "Administrators",
                  translations: { fr: "Administrateurs" },
                  items: [
                    { autogenerate: { directory: "doc/how-to/admin" } },
                  ],
                },
                {
                  label: "Developers",
                  translations: { fr: "Développeurs" },
                  items: [
                    { autogenerate: { directory: "doc/how-to/dev" } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "References",
          translations: { fr: "Références" },
          items: [
            {
              // One group per category of the generated reference: a category
              // added to the generator (`dnf-generator doc`) gets its group
              // here, `scripts/doc-coverage.test.mjs` fails otherwise.
              label: "Modules",
              items: [
                {
                  slug: "ref/modules",
                  label: "Overview",
                  translations: { fr: "Aperçu" },
                },
                {
                  label: "Mixins",
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/mixin" } }],
                },
                {
                  label: "Services",
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/service" } }],
                },
                {
                  label: "System",
                  translations: { fr: "Système" },
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/system" } }],
                },
                {
                  label: "Security",
                  translations: { fr: "Sécurité" },
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/security" } }],
                },
                {
                  label: "CLI Apps",
                  translations: { fr: "Apps CLI" },
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/console" } }],
                },
                {
                  label: "GUI Apps",
                  translations: { fr: "Apps graphiques" },
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/graphic" } }],
                },
                {
                  label: "Administration",
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/admin" } }],
                },
                {
                  label: "Users",
                  translations: { fr: "Utilisateurs" },
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/user" } }],
                },
                {
                  label: "Home Manager",
                  collapsed: true,
                  items: [{ autogenerate: { directory: "ref/modules/home" } }],
                },
              ],
            },
          ],
        },
        { label: "Changelog", slug: "changelog" },
        {
          label: "Thanks!",
          translations: { fr: "Merci !" },
          slug: "thanks"
        },
      ],
    }),
  ],
});
