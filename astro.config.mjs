import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';
import { targetBlank } from './src/plugins/targetBlank';

// https://astro.build/config
export default defineConfig({
	site: 'https://darkone-linux.github.io',
	trailingSlash: "never",
	markdown: {
		rehypePlugins: [
			[targetBlank, { domain: 'darkone-linux.github.io' }],
			[
				rehypeExternalLinks,
				{
				  content: { type: 'text', value: ' 🡥' }
				}
			],
		],
	},
	integrations: [
		starlight({
			title: "Darkone NixOS Framework",
			locales: {
				root: {
						label: 'English',
						lang: 'en-US',
				},
			},
			social: {
				github: 'https://github.com/gponcon/nixos-configuration',
			},
			logo: {
				light: './src/assets/arch.webp',
				dark: './src/assets/arch.webp',
			},
			sidebar: [
				{
					label: 'Documentation',
					autogenerate: { directory: 'doc' },
				},
				{
					label: 'References',
					autogenerate: { directory: 'ref' },
				},
				{ label: 'Changelog', slug: 'changelog' },
				{ label: 'About', slug: 'about' },
			],
		}),
	],
});
