export default {
    assetsInclude: "**/*.wasm",
    build: {
        minify: true,
    },
    server: {
        fs: {
            // Allow serving files from one level up to the project root
            allow: [".."],
        },
    },
};
