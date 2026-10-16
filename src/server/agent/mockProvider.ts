import { AGENT_PROMPT_VERSION } from "./prompt.js";
import type { AgentProvider, InvestigationInput, InvestigationOutcome } from "./types.js";
import type { EvidenceReport } from "../../contracts/evidence-report.schema.js";

// Proveedor mock, intercambiable por AGENT_PROVIDER=mock (ver .env.example).
// Permite a Dev 2 y Dev 4 trabajar contra un informe válido sin depender de
// credenciales reales de Nebius (flowguard-docs/implementation-checklist.md,
// Bloque 1, fila "Adaptador de Nebius").
export class MockAgentProvider implements AgentProvider {
  async investigate(input: InvestigationInput): Promise<InvestigationOutcome> {
    const firstViolation = input.violations.find((v) => v.result === "FAIL");

    if (input.decision === "ALLOW" || !firstViolation) {
      const report: EvidenceReport = {
        schema_version: "1.0",
        execution_id: input.executionId,
        attempt_id: "INV-ATT-MOCK",
        agent: {
          provider: "mock",
          model: "mock-v1",
          prompt_version: AGENT_PROMPT_VERSION,
        },
        investigation: {
          status: "COMPLETED",
          headline: "Pago aprobado sin infracciones detectadas",
          explanation: "El motor de reglas no reportó violaciones para esta ejecución.",
          findings: [],
          recommended_actions: [],
        },
        decision_summary: {
          decision: input.decision,
          decision_source: "RULE_ENGINE",
          agent_can_override: false,
        },
        limitations: [],
      };
      return { status: "COMPLETED", report };
    }

    const report: EvidenceReport = {
      schema_version: "1.0",
      execution_id: input.executionId,
      attempt_id: "INV-ATT-MOCK",
      agent: {
        provider: "mock",
        model: "mock-v1",
        prompt_version: AGENT_PROMPT_VERSION,
      },
      investigation: {
        status: "PARTIAL",
        headline: "Pago bloqueado por infracción de regla",
        explanation: `La regla ${firstViolation.rule_id} no se cumplió para esta ejecución.`,
        findings: [
          {
            finding_id: "FND-MOCK-001",
            rule_id: firstViolation.rule_id as EvidenceReport["investigation"]["findings"][number]["rule_id"],
            claim: `La regla ${firstViolation.rule_id} requiere revisión.`,
            evidence_refs: ["EV-MOCK-0001"],
          },
        ],
        recommended_actions: [
          { action: "REVIEW_RULE_VIOLATION", requires_human_action: true },
        ],
      },
      decision_summary: {
        decision: input.decision,
        decision_source: "RULE_ENGINE",
        agent_can_override: false,
      },
      limitations: ["Informe generado por el proveedor mock, no por Nebius."],
    };
    return { status: "PARTIAL", report };
  }
}
