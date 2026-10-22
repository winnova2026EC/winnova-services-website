// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
});
