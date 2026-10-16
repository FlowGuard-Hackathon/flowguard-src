import { describe, expect, it } from "vitest";
import { MockAgentProvider } from "./mockProvider.js";
import { validateReport } from "./validateReport.js";
import type { InvestigationInput } from "./types.js";

// developers/developer-3/work-plan.md, día 3:
// "Prueba unitaria que valida el mock contra el esquema Zod."
describe("MockAgentProvider", () => {
  const provider = new MockAgentProvider();

  it("produce un informe válido contra el esquema cuando la decisión es ALLOW", async () => {
    const input: InvestigationInput = {
      executionId: "EXE-TEST-0001",
      decision: "ALLOW",
      violations: [],
    };

    const outcome = await provider.investigate(input);
    expect(outcome.status).toBe("COMPLETED");

    const result = validateReport(outcome.status !== "FAILED" ? outcome.report : null);
    expect(result.valid).toBe(true);
  });

  it("produce un informe válido contra el esquema cuando la decisión es BLOCK", async () => {
    const input: InvestigationInput = {
      executionId: "EXE-TEST-0002",
      decision: "BLOCK",
      violations: [{ rule_id: "PAY-001", result: "FAIL" }],
    };

    const outcome = await provider.investigate(input);
    expect(outcome.status).toBe("PARTIAL");

    const result = validateReport(outcome.status !== "FAILED" ? outcome.report : null);
    expect(result.valid).toBe(true);
  });
});
