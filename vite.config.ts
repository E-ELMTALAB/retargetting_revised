import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/ui',
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8787',
      '/session': 'http://localhost:8787',
      '/campaigns': 'http://localhost:8787',
      '/analytics': 'http://localhost:8787',
      // Add more API routes as needed
    }
  }
}); 