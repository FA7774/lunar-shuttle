import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 关键配置：设置为相对路径，适配 GitHub Pages 非根目录部署
})
