import { HEALTH_STATUS, overallStatusOf } from "./health-status.js";

describe("overallStatusOf", () => {
  it("should be ok when there are no checks", () => {
    expect(overallStatusOf([])).toBe(HEALTH_STATUS.OK);
  });

  it("should be ok when every check is ok", () => {
    expect(overallStatusOf([HEALTH_STATUS.OK, HEALTH_STATUS.OK])).toBe(
      HEALTH_STATUS.OK
    );
  });

  it("should be degraded when one check is degraded", () => {
    expect(overallStatusOf([HEALTH_STATUS.OK, HEALTH_STATUS.DEGRADED])).toBe(
      HEALTH_STATUS.DEGRADED
    );
  });
});
