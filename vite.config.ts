import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

let commitHash = "";
try {
  commitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  console.warn("Не удалось получить git hash, используем dev-версию.", e);
  commitHash = "dev";
}

const versionParts = packageJson.version.split(".");
const versionPrefix =
  versionParts.length >= 2
    ? `${versionParts[0]}.${versionParts[1]}`
    : packageJson.version;

const appVersion = `${versionPrefix}.${commitHash}`;

export default defineConfig(({ command, mode }) => {
  const isProd = command === "build";
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH || (isProd ? "/listo/" : "/");

  return {
    base: basePath,

    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },

    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "Listo",
          short_name: "Listo",
          description: "Список покупок",
          theme_color: "#ffffff",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait",
          scope: basePath,
          start_url: basePath,
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.(html|htm)$/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "html-cache",
                expiration: {
                  maxAgeSeconds: 5 * 60,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
