import type { EvidenceReport } from "../../contracts/evidence-report.schema.js";

// RuleResult es un tipo provisional: debe reemplazarse por el que exporte
// src/contracts/engine.schema.ts cuando Dev 1 / Dev 4 lo congelen (ver
// flowguard-docs/implementation-checklist.md, Bloque 1).
export type RuleResult = {
  rule_id: string;
  result: "PASS" | "FAIL" | "INDETERMINATE";
};

// flowguard-docs/security.md § 1.1 — entrada mínima del agente.
export type InvestigationInput = {
  executionId: string;
  decision: "ALLOW" | "BLOCK";
  violations: RuleResult[];
};

export type InvestigationOutcome =
  | { status: "COMPLETED" | "PARTIAL"; report: EvidenceReport }
  | { status: "FAILED"; reason: string };

export interface AgentProvider {
  investigate(input: InvestigationInput): Promise<InvestigationOutcome>;
}
