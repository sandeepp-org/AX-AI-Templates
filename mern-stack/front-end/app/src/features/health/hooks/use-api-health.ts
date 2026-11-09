import { useEffect, useState } from "react";

import { fetchHealth, type HealthReport } from "../api/health.api";

/** The API's health as the page sees it: still asking, answered, or unreachable. */
type ApiHealth =
  | { state: "loading" }
  | { state: "up"; report: HealthReport }
  | { state: "down"; reason: string };

/** Asks the API for its health once, when the component mounts. */
const useApiHealth = (): ApiHealth => {
  const [health, setHealth] = useState<ApiHealth>({ state: "loading" });

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((report) => {
        if (active) {
          setHealth({ state: "up", report });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setHealth({
            state: "down",
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return health;
};

export { useApiHealth };
export type { ApiHealth };
