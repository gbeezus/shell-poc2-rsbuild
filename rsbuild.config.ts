import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

const { publicVars } = loadEnv({ prefixes: ['PUBLIC_'] });

const REMOTE_URL =
  process.env.PUBLIC_REMOTE_URL ??
  'http://localhost:3011/remoteEntry.js';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {
        thirdparty: `thirdparty@${REMOTE_URL}`,
      },
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
      },
    }),
  ],
  source: {
    define: publicVars,
    entry: { index: './src/main.tsx' },
  },
  server: {
    port: 3010,
  },
  html: {
    title: 'Shell Application (POC 2 — Module Federation, rsbuild)',
    tags: [
      // Brand overlay applied at the top of <head> so :root tokens resolve
      // before any component CSS evaluates. Same mechanism the third-party
      // tool uses in POC 1 Mechanism B — the shell eats its own dog food.
      {
        tag: 'link',
        attrs: { rel: 'stylesheet', href: '/brand/overrides.css' },
        head: true,
        append: false,
      },
    ],
  },
});
