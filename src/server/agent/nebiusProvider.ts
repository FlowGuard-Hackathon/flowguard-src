import type { AgentProvider, InvestigationInput, InvestigationOutcome } from "./types.js";

// Integración real con Nebius Token Factory.
// NO IMPLEMENTAR hasta completar flowguard-docs/security.md § 1.8
// (lista de verificación de compatibilidad con Nebius) — bloque 3, día 7-9
// de developers/developer-3/work-plan.md.
//
// Mientras la checklist no esté confirmada, usar MockAgentProvider
// (ver mockProvider.ts) a través de createAgentProvider() en index.ts.
export class NebiusAgentProvider implements AgentProvider {
  investigate(_input: InvestigationInput): Promise<InvestigationOutcome> {
    throw new Error(
      "NebiusAgentProvider no implementado todavía: completar la checklist de " +
        "flowguard-docs/security.md § 1.8 antes de integrar (ver work-plan.md, día 7-9).",
    );
  }
}
