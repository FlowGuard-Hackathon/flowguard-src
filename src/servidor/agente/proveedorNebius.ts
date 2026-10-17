import { mensajes } from "../../mensajes/index.js";
import type { EntradaInvestigacion, ProveedorAgente, ResultadoInvestigacion } from "./tipos.js";

// No se implementa hasta cerrar la checklist de seguridad.md § 1.8 (días 7-9)
export class ProveedorAgenteNebius implements ProveedorAgente {
  investigar(_entrada: EntradaInvestigacion): Promise<ResultadoInvestigacion> {
    throw new Error(mensajes.agente.errores.nebiusNoImplementado);
  }
}
