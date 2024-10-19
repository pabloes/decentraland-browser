import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // If you're using React, adjust based on your framework

export default defineConfig({
  plugins: [react()], // Add the necessary plugins here
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
    },
  },
});