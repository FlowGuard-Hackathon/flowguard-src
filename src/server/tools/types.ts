// Firmas de las herramientas de lectura del agente.
// Fuente de verdad: flowguard-docs/security.md § 1.2.
// Implementación real pendiente de que Dev 1 publique src/server/persistence/
// (ver developers/developer-3/work-plan.md, día 4-5). Hasta entonces, cada
// herramienta lanza NotImplementedError para no simular datos de base de datos.

export class NotImplementedError extends Error {
  constructor(toolName: string) {
    super(
      `${toolName} no está implementada todavía: depende de src/server/persistence/ (Dev 1).`,
    );
  }
}

export type GetExecutionParams = { execution_id: string };
export type GetRuleDetailsParams = { rule_id: string };
export type GetRuleResultsParams = { execution_id: string };
export type GetEvidenceParams = { execution_id: string; evidence_ref: string };
export type GetPaymentContextParams = { execution_id: string };
