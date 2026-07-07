import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "loan-calculator",
        short_name: "قسطلي",
        description: "loan-calculator",
        theme_color: "#000000",
        background_color: "#ffffff", // إضافة هذا السطر مهمة لبعض الهواتف أثناء تحميل التطبيق
        display: "standalone", // تضمن ظهور التطبيق بدون شريط المتصفح كأنه تطبيق موبايل أصيل
        start_url: "/?launcher=pwa",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        cacheId: `loan-calculator-${pkg.version}`,
        // تفعيل تتبع التحليلات في وضع الأوفلاين
        offlineGoogleAnalytics: true,
      },

      devOptions: {
        // enable service worker in the Vite dev server for local testing
        // enabled: true,
        enabled: process.env.NODE_ENV === "development",
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
