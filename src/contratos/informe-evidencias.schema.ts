import { z } from "zod";

// Contrato del informe del agente: flowguard-docs/contratos-api.md § 10.
// Propietario: Dev 3. Cualquier cambio se coordina con Dev 5 y lo confirman Dev 1 y Dev 2.

export const EsquemaReglaId = z.enum(["PAG-001", "PAG-002", "PAG-003", "PAG-004", "PAG-005"]);

export const EsquemaDecision = z.enum(["PERMITIR", "BLOQUEAR"]);

export const EsquemaEstadoInvestigacion = z.enum(["COMPLETADA", "PARCIAL", "FALLIDA"]);

export const EsquemaHallazgo = z.object({
  hallazgo_id: z.string(),
  regla_id: EsquemaReglaId,
  afirmacion: z.string(),
  refs_evidencia: z.array(z.string()).min(1),
});

export const EsquemaAccionRecomendada = z.object({
  accion: z.string(),
  requiere_accion_humana: z.boolean(),
});

export const EsquemaInformeEvidencias = z.object({
  version_esquema: z.literal("1.0"),
  ejecucion_id: z.string(),
  intento_id: z.string(),
  agente: z.object({
    proveedor: z.string(),
    modelo: z.string(),
    version_prompt: z.string(),
  }),
  investigacion: z.object({
    estado: EsquemaEstadoInvestigacion,
    titular: z.string(),
    explicacion: z.string(),
    hallazgos: z.array(EsquemaHallazgo),
    acciones_recomendadas: z.array(EsquemaAccionRecomendada),
  }),
  resumen_decision: z.object({
    decision: EsquemaDecision,
    origen_decision: z.literal("MOTOR_REGLAS"),
    agente_puede_anular: z.literal(false),
  }),
  limitaciones: z.array(z.string()),
});

export type InformeEvidencias = z.infer<typeof EsquemaInformeEvidencias>;
export type Hallazgo = z.infer<typeof EsquemaHallazgo>;
