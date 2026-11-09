// Aatmix Shadcn React - Main Entry Point
// Re-exports components, providers, hooks, and theme utilities from chroma

export * from './providers';
export * from './hooks';
export * from './components';

// Re-export theme utilities from chroma (single source of truth)
export {
    ThemeProvider,
    useTheme,
    applyColorTheme,
    initializeColorTheme,
    getResolvedTheme,
    setColorTheme
} from '@canopy/chroma';