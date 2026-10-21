import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, "../.."), "");
  const deployed = (env.MSDATA_BASE_URL || "https://sports-api.sportsdata365.com/msdata").replace(/\/msdata\/?$/, "");
  return {
    envDir: resolve(__dirname, "../.."),
    envPrefix: ["VITE_"],
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: Number(env.WEB_PORT || 5175),
      proxy: {
        "/msdata": {
          target: deployed,
          changeOrigin: true,
          secure: true,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => {
              if (env.MSDATA_API_KEY) proxyReq.setHeader("x-apim-key", env.MSDATA_API_KEY);
              if (env.MSDATA_LIVE_KEY) proxyReq.setHeader("X-Live-Key", env.MSDATA_LIVE_KEY);
            });
          },
        },
      },
    },
  };
});
