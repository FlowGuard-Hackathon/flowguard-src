import type { InformeEvidencias } from "../../contratos/informe-evidencias.schema.js";

// Provisional: se reemplaza por el tipo de src/contratos/motor.schema.ts cuando exista
export type ResultadoRegla = {
  regla_id: string;
  resultado: "CUMPLE" | "NO_CUMPLE" | "INDETERMINADO";
};

// seguridad.md § 1.1: entrada mínima del agente
export type EntradaInvestigacion = {
  ejecucionId: string;
  decision: "PERMITIR" | "BLOQUEAR";
  infracciones: ResultadoRegla[];
};

export type ResultadoInvestigacion =
  | { estado: "COMPLETADA" | "PARCIAL"; informe: InformeEvidencias }
  | { estado: "FALLIDA"; motivo: string };

export interface ProveedorAgente {
  investigar(entrada: EntradaInvestigacion): Promise<ResultadoInvestigacion>;
}
