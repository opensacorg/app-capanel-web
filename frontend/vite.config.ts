import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const apiTarget = process.env.VITE_API_URL || 'http://localhost:8000'

/**
 * base: './' is required for relative paths in single-container deployment
 */
const config = defineConfig({
	base: './',
	build: {
		outDir: 'dist',
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		proxy: {
			'/api': {
				target: apiTarget,
				changeOrigin: true,
			},
		},
	},
	plugins: [
		devtools(),
		viteTsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
		tailwindcss(),
		tanstackStart({
			spa: {
				prerender: {
					enabled: true,
					// 2. Add a delay to allow the Nitro server to boot in the container
					// This prevents the "fetch failed" immediately upon starting
					retryCount: 10,
					retryDelay: 3000,
				},
			},
		}),
		react({
			babel: {
				plugins: ['babel-plugin-react-compiler'],
			},
		}),
	],
})

export default config
