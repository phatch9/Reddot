import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
    host: true,
    proxy: {
        "/api": {
            target: "http://127.0.0.1:3000/",
            changeOrigin: true,
            secure: false,
            ws: true,
        },
    },
    },
  // Ensure Vite pre-bundles React correctly in cases where package exports
  // or tooling cause resolution issues.
    resolve: {
    alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
        }
    },
    optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime']
    },
});