import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-helmet-async'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, ''),
      },
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 2000, // Increase limit from 500 KB to 2 MB
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            vendor: ['react-helmet-async'],
          },
        },
      },
    },
  };
});