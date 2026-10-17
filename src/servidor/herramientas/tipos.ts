import { mensajes } from "../../mensajes/index.js";

export class ErrorNoImplementada extends Error {
  constructor(herramienta: string) {
    super(mensajes.herramientas.noImplementada(herramienta));
  }
}

export type ParamsObtenerEjecucion = { ejecucion_id: string };
export type ParamsObtenerDetalleRegla = { regla_id: string };
export type ParamsObtenerResultadosReglas = { ejecucion_id: string };
export type ParamsObtenerEvidencia = { ejecucion_id: string; ref_evidencia: string };
export type ParamsObtenerContextoPago = { ejecucion_id: string };
