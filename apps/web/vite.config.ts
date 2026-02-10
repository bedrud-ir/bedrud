import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		sveltekit(),
		compression({
			algorithm: 'brotliCompress',
			ext: '.br',
		}),
		compression({
			algorithm: 'gzip',
			ext: '.gz',
		}),
		visualizer({
			emitFile: true,
			filename: 'stats.html',
		}),
	],
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						if (id.includes('livekit-client')) {
							return 'vendor-livekit';
						}
						return 'vendor';
					}
				},
			},
		},
		reportCompressedSize: true,
		chunkSizeWarningLimit: 1000,
	},
	server: {
		allowedHosts: ['b.a16.at', 'bedrud.xyz'],
		proxy: {
			'/api': {
				target: 'http://localhost:8090',
				changeOrigin: true,
			},
		},
	}
});
