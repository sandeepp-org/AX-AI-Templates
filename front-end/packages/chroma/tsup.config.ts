import { defineConfig, type Options } from 'tsup';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { compile } from 'sass';

const config: Options = {
  entry: {
    index: 'src/index.ts',
    'themes/index': 'src/themes-provider/index.ts',
  },
  external: [
    "react",
    "react/jsx-runtime",
    "next",
    "next/font/google"
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  onSuccess: async () => {
    // Create output directories
    mkdirSync(resolve('dist/css'), { recursive: true });
    mkdirSync(resolve('dist/css/tokens'), { recursive: true });
    mkdirSync(resolve('dist/css/tokens/colors'), { recursive: true });
    mkdirSync(resolve('dist/css/themes'), { recursive: true });
    mkdirSync(resolve('dist/assets'), { recursive: true });
    mkdirSync(resolve('dist/assets/fonts'), { recursive: true });

    // Compile main SCSS to CSS (includes all themes with centralized tokens)
    const indexResult = compile(resolve('src/index.scss'));
    writeFileSync(resolve('dist/css/index.css'), indexResult.css);

    // Compile all themes to a single CSS file
    const allThemesResult = compile(resolve('src/themes/index.scss'));
    writeFileSync(resolve('dist/css/themes/all.css'), allThemesResult.css);

    // Compile individual theme files
    mkdirSync(resolve('dist/css/themes/indigo'), { recursive: true });
    mkdirSync(resolve('dist/css/themes/green'), { recursive: true });
    mkdirSync(resolve('dist/css/themes/blue'), { recursive: true });

    // Blue theme
    const blueLightResult = compile(resolve('src/themes/blue/light/index.scss'));
    writeFileSync(resolve('dist/css/themes/blue/light.css'), blueLightResult.css);
    const blueDarkResult = compile(resolve('src/themes/blue/dark/index.scss'));
    writeFileSync(resolve('dist/css/themes/blue/dark.css'), blueDarkResult.css);

    // Compile Tailwind v4 preset from SCSS themes (single source of truth)
    const presetResult = compile(resolve('src/themes/index.scss'));
    writeFileSync(resolve('dist/css/tailwind-preset.css'), presetResult.css);

    // Copy fonts from assets folder (outside src)
    const srcFontsDir = resolve('assets/fonts');
    if (existsSync(srcFontsDir)) {
      cpSync(srcFontsDir, resolve('dist/assets/fonts'), { recursive: true });
    }

    // Copy icons from assets folder (outside src)
    const srcIconsDir = resolve('assets/icons');
    if (existsSync(srcIconsDir)) {
      mkdirSync(resolve('dist/assets/icons'), { recursive: true });
      cpSync(srcIconsDir, resolve('dist/assets/icons'), { recursive: true });
    }
  },
};

export default defineConfig(config);