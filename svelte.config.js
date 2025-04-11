import adapter from '@sveltejs/adapter-static';

const config = {
    kit: {
        adapter: adapter({
            fallback: 'index.html',
            strict: false
        }),
        prerender: {
            enabled: false
        }
    },
};

export default config;