import {
  NotImplementedError,
  type GetEvidenceParams,
  type GetExecutionParams,
  type GetPaymentContextParams,
  type GetRuleDetailsParams,
  type GetRuleResultsParams,
} from "./types.js";

// Las cinco herramientas de lectura del agente (flowguard-docs/security.md § 1.2).
// Se implementan en el backend; Nebius solo solicita una herramienta por vez y
// el servidor valida los argumentos y ejecuta la consulta con permisos limitados.
//
// TODO (Dev 3, día 4-5): reemplazar cada NotImplementedError por la consulta
// real contra src/server/persistence/ una vez Dev 1 publique ese módulo.

export async function get_execution(_params: GetExecutionParams): Promise<unknown> {
  throw new NotImplementedError("get_execution");
}

export async function get_rule_details(_params: GetRuleDetailsParams): Promise<unknown> {
  throw new NotImplementedError("get_rule_details");
}

export async function get_rule_results(_params: GetRuleResultsParams): Promise<unknown> {
  throw new NotImplementedError("get_rule_results");
}

export async function get_evidence(_params: GetEvidenceParams): Promise<unknown> {
  throw new NotImplementedError("get_evidence");
}

export async function get_payment_context(_params: GetPaymentContextParams): Promise<unknown> {
  throw new NotImplementedError("get_payment_context");
}
