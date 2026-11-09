import { Button } from '@canopy/shadcn-modulus';
import { useTheme } from '@canopy/chroma';

export default function DesignSystemDemo(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleDarkMode = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  };

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Canopy Design System</h1>
            <p className="text-muted-foreground mt-1">
              Multi-theme Component Showcase
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={toggleDarkMode}>
              {resolvedTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
        </div>

        <section className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground">
          <p>test theme</p>
        </section>

        {/* Shadcn Core Buttons */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">Shadcn Core Buttons</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Base button component from @canopy/shadcn-core
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button className='p-1' size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">States</h3>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </section>

        {/* React Buttons */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">React Buttons</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enhanced button from @canopy/sf-shadcn-react
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        {/* Status Buttons */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">Status Buttons</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Buttons using status color variants
            </p>
          </div>
        </section>

        {/* Theme Colors */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">Theme Colors</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Semantic color tokens that adapt to the selected theme
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'primary',
              'secondary',
              'accent',
              'muted',
              'destructive',
              'success',
              'warning',
              'info',
            ].map((color) => (
              <div key={color} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: `var(--${color})` }}
                />
                <span className="text-sm font-medium">{color}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status Colors */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">Status Colors</h2>
            <p className="text-sm text-muted-foreground mt-1">
              State indicator color tokens
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'status-pending',
              'status-active',
              'status-inactive',
              'status-processing',
            ].map((color) => (
              <div key={color} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: `var(--${color})` }}
                />
                <span className="text-sm font-medium">
                  {color.replace('status-', '')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Data Visualization Colors */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">
              Data Visualization Colors
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Semantic color palette for charts, graphs, and data visualization
            </p>
          </div>

          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-md border border-border"
                  style={{ backgroundColor: `var(--color-data-${i})` }}
                />
                <span className="text-xs text-muted-foreground">data-{i}</span>
              </div>
            ))}
          </div>
        </section>

        {/* UI Colors */}
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">UI Colors</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Core UI color tokens
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'background', label: 'Background' },
              { name: 'foreground', label: 'Foreground' },
              { name: 'card', label: 'Card' },
              { name: 'popover', label: 'Popover' },
              { name: 'border', label: 'Border' },
              { name: 'input', label: 'Input' },
              { name: 'ring', label: 'Ring' },
            ].map(({ name, label }) => (
              <div key={name} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border-2 border-border"
                  style={{ backgroundColor: `var(--${name})` }}
                />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Current Theme Info */}

        <section className="p-6 bg-card rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">
            Current Configuration
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Color Theme:</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <span className="ml-2 font-mono font-semibold">
                {resolvedTheme}
              </span>
            </div>
          </div>
        </section>

        // Add test buttons with attributes
        <section className="mt-4 space-y-4">
          <h3 className="text-lg font-medium">Attribute-Based Button Tests</h3>

          {/* Size tests */}
          <div className="flex gap-3">
            <Button size="sm" variant="default">Small</Button>
            <Button size="default" variant="default">Default</Button>
            <Button size="lg" variant="default">Large</Button>
            <Button size="icon" variant="default">🔥</Button>
          </div>

          {/* Variant tests */}
          <div className="flex gap-3">
            <Button size="default" variant="default">Default</Button>
            <Button size="default" variant="outline">Outline</Button>
            <Button size="default" variant="secondary">Secondary</Button>
            <Button size="default" variant="ghost">Ghost</Button>
            <Button size="default" variant="destructive">Destructive</Button>
            <Button size="default" variant="link">Link</Button>
          </div>

          {/* Data attribute tests */}
          <div className="flex gap-3">
            <button data-size="sm" data-variant="outline">Data Attrs</button>
          </div>
        </section>

        <section>
          <Button className="text-xs" size="sm" variant="default">Default123</Button>
        </section>

        <section className="mt-4 space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-2xl font-semibold">Custom Attribute-Based Buttons</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Testing custom Tailwind plugin with attribute-based styling
            </p>
          </div>

          {/* Size tests with Button component */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Size Tests (Button Component)</h3>
            <div className="flex gap-3">
              <Button size="sm" variant="default">Small</Button>
              <Button size="default" variant="default">Default</Button>
              <Button size="lg" variant="default">Large</Button>
              <Button size="icon" variant="default">🔥</Button>
            </div>
          </div>

          {/* Variant tests with Button component */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Variant Tests (Button Component)</h3>
            <div className="flex gap-3">
              <Button size="default" variant="default">Default</Button>
              <Button size="default" variant="outline">Outline</Button>
              <Button size="default" variant="secondary">Secondary</Button>
              <Button size="default" variant="ghost">Ghost</Button>
              <Button size="default" variant="destructive">Destructive</Button>
              <Button size="default" variant="link">Link</Button>
            </div>
          </div>

          {/* Raw HTML button tests with data attributes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Raw HTML Buttons (Data Attributes)</h3>
            <div className="flex gap-3">
              <Button data-size="sm" data-variant="default">Small Raw</Button>
              <Button data-size="default" data-variant="outline">Default Raw</Button>
              <Button data-size="lg" data-variant="secondary">Large Raw</Button>
              <Button data-size="icon" data-variant="ghost">🚀</Button>
            </div>
          </div>

          {/* Mixed attribute tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mixed Attribute Tests</h3>
            <div className="flex gap-3">
              <Button size="sm" variant="outline">Size Attr</Button>
              <Button size="default" variant="destructive">Data Attrs</Button>
              <Button className="text-xs" size="sm" variant="default">Custom Class + Attrs</Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>aatmix Design System • Built with Shadcn UI + Tailwind CSS v4</p>
        </footer>
      </div>
    </div>
  );
}
