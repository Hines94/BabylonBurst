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
          '@BabylonBoostClient': path.resolve(__dirname, '../Client/src'),
          '@engine': path.resolve(__dirname, '../Client/src'),
          '@userCode': path.resolve(__dirname, '../../Source/TsSource')
        }
    },
    plugins: [
        {
            name: "watch-external",
            configureServer(server) {
                server.watcher.add(path.resolve(__dirname, "./public/**/*.html"));
            },
        },
    ],
});
