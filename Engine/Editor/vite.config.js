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
          '@BabylonBoostClient': path.resolve(__dirname, '../Client/src')
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
