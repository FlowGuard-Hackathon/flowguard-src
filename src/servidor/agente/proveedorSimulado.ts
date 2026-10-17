import type { InformeEvidencias } from "../../contratos/informe-evidencias.schema.js";
import { mensajes } from "../../mensajes/index.js";
import { VERSION_PROMPT_AGENTE } from "./prompt.js";
import type { EntradaInvestigacion, ProveedorAgente, ResultadoInvestigacion } from "./tipos.js";

const textos = mensajes.agente.simulado;

// AGENTE_PROVEEDOR=simulado: informe válido sin credenciales de Nebius
export class ProveedorAgenteSimulado implements ProveedorAgente {
  async investigar(entrada: EntradaInvestigacion): Promise<ResultadoInvestigacion> {
    const primeraInfraccion = entrada.infracciones.find((i) => i.resultado === "NO_CUMPLE");
    const base = {
      version_esquema: "1.0" as const,
      ejecucion_id: entrada.ejecucionId,
      intento_id: "INT-SIMULADO",
      agente: { proveedor: "simulado", modelo: "simulado-v1", version_prompt: VERSION_PROMPT_AGENTE },
      resumen_decision: {
        decision: entrada.decision,
        origen_decision: "MOTOR_REGLAS" as const,
        agente_puede_anular: false as const,
      },
    };

    if (entrada.decision === "PERMITIR" || !primeraInfraccion) {
      const informe: InformeEvidencias = {
        ...base,
        investigacion: {
          estado: "COMPLETADA",
          titular: textos.titularSinInfracciones,
          explicacion: textos.explicacionSinInfracciones,
          hallazgos: [],
          acciones_recomendadas: [],
        },
        limitaciones: [],
      };
      return { estado: "COMPLETADA", informe };
    }

    const reglaId = primeraInfraccion.regla_id;
    const informe: InformeEvidencias = {
      ...base,
      investigacion: {
        estado: "PARCIAL",
        titular: textos.titularBloqueado,
        explicacion: textos.explicacionBloqueado(reglaId),
        hallazgos: [
          {
            hallazgo_id: "FND-SIMULADO-001",
            regla_id: reglaId as InformeEvidencias["investigacion"]["hallazgos"][number]["regla_id"],
            afirmacion: textos.afirmacionRevision(reglaId),
            refs_evidencia: ["EV-SIMULADO-0001"],
          },
        ],
        acciones_recomendadas: [{ accion: "REVISAR_INFRACCION_REGLA", requiere_accion_humana: true }],
      },
      limitaciones: [textos.limitacion],
    };
    return { estado: "PARCIAL", informe };
  }
}
