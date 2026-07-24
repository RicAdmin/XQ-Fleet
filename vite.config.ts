import { loadEnv } from 'vite'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = env.SITE_URL || env.BETTER_AUTH_URL || 'http://localhost:3000'
  const isDev = mode === 'development'

  return {
    plugins: [
      ...(isDev ? [devtools()] : []),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      netlify({
        dev: {
          edgeFunctions: { enabled: false },
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    },
    build: {
      // Hidden maps for error monitoring without public .map fetch noise in Lighthouse.
      sourcemap: 'hidden',
    },
  }
})
