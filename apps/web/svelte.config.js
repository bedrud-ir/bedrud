import { mdsvex } from "mdsvex";
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {

    preprocess: [
        vitePreprocess(),
        mdsvex()
    ],

    kit: {
        adapter: adapter({
            fallback: 'index.html',
            strict: false
        }),
        alias: {
            "@/*": "./path/to/lib/*",
        },
    },

    extensions: [
        ".svelte", 
        ".svx"
    ]
};

export default config;
