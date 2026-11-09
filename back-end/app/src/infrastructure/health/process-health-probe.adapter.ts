import type { HealthProbePort } from "../../modules/health/index.js";

import { HEALTH_STATUS } from "../../modules/health/index.js";

/** The name the report lists this check under. */
const PROCESS_CHECK_NAME = "process";

/**
 * The probe of the process itself: answering at all means it is up. The first adapter of `HealthProbePort`;
 * a database or cache probe is written the same way, beside this file.
 */
const createProcessHealthProbe = (): HealthProbePort => ({
  check: async () => ({ name: PROCESS_CHECK_NAME, status: HEALTH_STATUS.OK }),
});

export { createProcessHealthProbe, PROCESS_CHECK_NAME };
