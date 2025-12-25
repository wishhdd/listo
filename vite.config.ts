import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { defineConfig } from "vite";
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

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  return {
    base: isProd ? "/listo/" : "/",

    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },

    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
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
          scope: "/listo/",
          start_url: "/listo/",
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
      }),
    ],
  };
});
