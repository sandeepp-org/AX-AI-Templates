import { useTheme } from "@canopy/chroma";
import { Button } from "@canopy/shadcn-modulus";

import { useApiHealth, type ApiHealth } from "../hooks/use-api-health";

// The one line the page shows for each state of the API.
const messageOf = (health: ApiHealth): string => {
  if (health.state === "loading") {
    return "Checking the API…";
  }
  if (health.state === "down") {
    return `API unreachable: ${health.reason}`;
  }
  return `API status: ${health.report.status}`;
};

/** Shows whether the back-end answers, and a button that switches the light and dark theme. */
function ApiStatus() {
  const health = useApiHealth();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <section className="flex flex-col items-center gap-4">
      <p role="status" className="text-muted-foreground">
        {messageOf(health)}
      </p>
      <Button
        variant="outline"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
      </Button>
    </section>
  );
}

export { ApiStatus };
