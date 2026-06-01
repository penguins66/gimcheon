import { defineConfig } from 'vite';

// 멀티플레이어 단계에서 server/ws 설정이 들어올 자리.
export default defineConfig({
  base: './',
  server: { port: 5173, open: false },
});
