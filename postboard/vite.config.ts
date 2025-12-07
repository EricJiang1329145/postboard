import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// 自定义Vite插件，用于生成404.html文件
const generate404Plugin = () => {
  return {
    name: 'generate-404',
    closeBundle() {
      // 生成404.html文件
      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting...</title>
    <script>
      // 将所有请求重定向到index.html，让React Router处理路由
      window.location.replace('/postboard' + window.location.pathname + window.location.search);
    </script>
  </head>
  <body>
    <p>正在重定向到首页...</p>
  </body>
</html>
`;
      // 写入404.html文件到输出目录
      writeFileSync('../dist/404.html', html);
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), generate404Plugin()],
  // GitHub Pages 部署配置，base URL 设置为仓库名称
  base: "/postboard/",
  // 输出目录设置为项目根目录下的dist
  build: {
    outDir: "../dist",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
