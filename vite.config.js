import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    port: 8082, // 设置为你想要使用的端口号
    host: true, // 允许通过所有IP地址访问（等同于0.0.0.0）
    strictPort: true, // 端口被占用时会直接退出，而不是尝试其他端口
    // 添加代理配置，将API请求转发到后端服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 构建配置
  build: {
    outDir: 'dist'
  }
})