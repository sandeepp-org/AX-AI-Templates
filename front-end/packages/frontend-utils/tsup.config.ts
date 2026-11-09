import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/grpc/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@grpc/grpc-js', '@grpc/proto-loader'],
  treeshake: true
});
