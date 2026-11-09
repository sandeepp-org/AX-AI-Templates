import { ThemeProvider } from "@canopy/chroma";

import { ApiStatus } from "./features/health";

/** The key the chosen light/dark theme is remembered under in the browser. */
const THEME_STORAGE_KEY = "mern-stack-theme";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey={THEME_STORAGE_KEY}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-foreground">
        <h1 className="text-4xl font-bold">Hello World</h1>
        <ApiStatus />
      </main>
    </ThemeProvider>
  );
}

export { App };
