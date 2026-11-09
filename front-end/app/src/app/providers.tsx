import { ThemeProvider } from '@canopy/chroma';

/**
 * App Providers for Design System Demo
 */
export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <ThemeProvider
            defaultTheme="light"
            storageKey="sf-theme"
        >
            {children}
        </ThemeProvider>
    );
}