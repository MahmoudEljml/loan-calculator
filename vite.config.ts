import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
        short_name: "Loan Calculator",
        description: "loan-calculator",
        theme_color: "#ffffff",
        start_url: "/?launcher=pwa",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        cacheId: "loan-calculator-v2.4",
        // تفعيل تتبع التحليلات في وضع الأوفلاين
        offlineGoogleAnalytics: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/elgamal\.infinityfreeapp\.com\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "site-cache",
              networkTimeoutSeconds: 5, // سيعطي السيرفر 5 ثوانٍ فقط، إذا فشل يعود للكاش
              expiration: {
                maxEntries: 10,
                // قلل هذه المدة إلى 24 ساعة بدلاً من سنة أثناء التطوير
                maxAgeSeconds: 5,
              },
            },
          },
        ],
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
});
