import { defineConfig } from 'tsup';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { compile } from 'sass';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/providers/index.ts',
    'src/hooks/index.ts'
  ],
  external: [
    "react",
    "react-dom",
    "@canopy/shadcn-core",
    "@canopy/chroma",
    "@radix-ui/react-slot",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    "tailwindcss"
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  onSuccess: async () => {
    mkdirSync(resolve('dist/css'), { recursive: true });
    const bundlePath = resolve('src/styles/bundle.scss');
    if (existsSync(bundlePath)) {
      const result = compile(bundlePath);
      writeFileSync(resolve('dist/css/styles.css'), result.css);
    }
  },
});


