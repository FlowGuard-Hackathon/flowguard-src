import { z } from "zod";

// Contrato del informe del agente.
// Fuente de verdad: flowguard-docs/api-contracts.md § 10.
// Cualquier cambio a este esquema debe acordarse con Dev 1 y Dev 4 antes de modificarse,
// porque Dev 2 (frontend) y Dev 4 (fixtures/pruebas) dependen de esta forma exacta.

export const RuleIdSchema = z.enum([
  "PAY-001",
  "PAY-002",
  "PAY-003",
  "PAY-004",
  "PAY-005",
]);

export const DecisionSchema = z.enum(["ALLOW", "BLOCK"]);

export const InvestigationStatusSchema = z.enum([
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);

export const FindingSchema = z.object({
  finding_id: z.string(),
  rule_id: RuleIdSchema,
  claim: z.string(),
  evidence_refs: z.array(z.string()).min(1),
});

export const RecommendedActionSchema = z.object({
  action: z.string(),
  requires_human_action: z.boolean(),
});

export const EvidenceReportSchema = z.object({
  schema_version: z.literal("1.0"),
  execution_id: z.string(),
  attempt_id: z.string(),
  agent: z.object({
    provider: z.string(),
    model: z.string(),
    prompt_version: z.string(),
  }),
  investigation: z.object({
    status: InvestigationStatusSchema,
    headline: z.string(),
    explanation: z.string(),
    findings: z.array(FindingSchema),
    recommended_actions: z.array(RecommendedActionSchema),
  }),
  decision_summary: z.object({
    decision: DecisionSchema,
    decision_source: z.literal("RULE_ENGINE"),
    agent_can_override: z.literal(false),
  }),
  limitations: z.array(z.string()),
});

export type EvidenceReport = z.infer<typeof EvidenceReportSchema>;
export type Finding = z.infer<typeof FindingSchema>;
