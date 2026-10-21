import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_UPSTREAM = "https://sports-api.sportsdata365.com/msdata";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const deployed = (env.VITE_MSDATA_BASE_URL || env.MSDATA_BASE_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
  const target = deployed.replace(/\/msdata\/?$/, "") || "https://sports-api.sportsdata365.com";

  return {
    plugins: [react()],
    envPrefix: ["VITE_"],
    define: {
      "import.meta.env.VITE_MSDATA_BASE_URL": JSON.stringify(env.VITE_MSDATA_BASE_URL || env.MSDATA_BASE_URL || DEFAULT_UPSTREAM),
      "import.meta.env.VITE_MSDATA_API_KEY": JSON.stringify(env.VITE_MSDATA_API_KEY || env.MSDATA_API_KEY || ""),
      "import.meta.env.VITE_MSDATA_LIVE_KEY": JSON.stringify(env.VITE_MSDATA_LIVE_KEY || env.MSDATA_LIVE_KEY || ""),
    },
    server: {
      host: "127.0.0.1",
      port: Number(env.WEB_PORT || 5175),
      proxy: {
        "/msdata": {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
