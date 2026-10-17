import { mensajes } from "../../mensajes/index.js";
import { ProveedorAgenteNebius } from "./proveedorNebius.js";
import { ProveedorAgenteSimulado } from "./proveedorSimulado.js";
import type { ProveedorAgente } from "./tipos.js";

export * from "./tipos.js";
export * from "./validarInforme.js";
export { PROMPT_SISTEMA_AGENTE, VERSION_PROMPT_AGENTE } from "./prompt.js";

// AGENTE_PROVEEDOR=simulado por defecto hasta cerrar la checklist de Nebius
export function crearProveedorAgente(): ProveedorAgente {
  const proveedor = process.env.AGENTE_PROVEEDOR ?? "simulado";
  switch (proveedor) {
    case "simulado":
      return new ProveedorAgenteSimulado();
    case "nebius":
      return new ProveedorAgenteNebius();
    default:
      throw new Error(mensajes.agente.errores.proveedorDesconocido(proveedor));
  }
}
