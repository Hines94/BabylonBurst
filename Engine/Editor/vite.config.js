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
          "@engine":path.resolve(__dirname, '../Shared/src'),
          '@userCode': path.resolve(__dirname, '../../Source/ClientSource')
        }
    },
    plugins: [
        {
            name: "watch-external",
            configureServer(server) {
                server.watcher.add(path.resolve(__dirname, "./public/**/*.html"));
            },
        }
    ],
});
