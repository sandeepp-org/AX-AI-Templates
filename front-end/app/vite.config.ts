import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createShadcnAliases } from '../../packages/shadcn-modulus/config/vite-aliases';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const shadcnAliases = createShadcnAliases(__dirname);

  return {
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        ...shadcnAliases,
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    server: {
      port: 3006,
      open: true,
      host: true, // Allow external connections
      cors: true,
    },
    build: {
      target: env.VITE_BUILD_TARGET || 'es2020',
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@canopy/shadcn-core', '@canopy/shadcn-modulus'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});