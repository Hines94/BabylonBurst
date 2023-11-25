import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        minify: true,
    },
    publicDir: "./public",
    server: {
        fs: {
            // Allow serving files from one level up to the project root
            allow: ["..", "../"],
        },
    },
    resolve: {
        alias: {
          '@BabylonBurstClient': path.resolve(__dirname, '../Client/src'),
          "@BabylonBurstCore":path.resolve(__dirname, '../Shared/src'),
          '@BabylonBurstEditor': path.resolve(__dirname, './src'),
          '@userCode': path.resolve(__dirname, '../../Source')
        }
    },
    plugins: [
        {
            name: "watch-external",
            configureServer(server) {
                server.watcher.add(path.resolve(__dirname, "./public/**/*.html"));
            },
        },
        {
            name: 'fix-recast',
            transform(code, id) {
              if (id.includes('recast-detour.js')) {
                return code.replace(`this["Recast"]`, 'window["Recast"]');
              }
            }
        }      
    ],
});
