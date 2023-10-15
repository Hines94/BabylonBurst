import path from 'path';

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
    resolve: {
        alias: {
            '@BabylonBurstClient': path.resolve(__dirname, 'src'),
            '@engine': path.resolve(__dirname, '../Shared/src'),
            '@userCode': path.resolve(__dirname, '../../Source/TsSource'),
        }
    }
};
