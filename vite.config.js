import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://103.172.44.99:8989",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/hcm/api"),
         configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Preserve Authorization header
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        },
      },
    },
  },
})
