import {
  ErrorNoImplementada,
  type ParamsObtenerContextoPago,
  type ParamsObtenerDetalleRegla,
  type ParamsObtenerEjecucion,
  type ParamsObtenerEvidencia,
  type ParamsObtenerResultadosReglas,
} from "./tipos.js";

// Stubs hasta que exista src/servidor/persistencia/ (seguridad.md § 1.2)

export async function obtener_ejecucion(_params: ParamsObtenerEjecucion): Promise<unknown> {
  throw new ErrorNoImplementada("obtener_ejecucion");
}

export async function obtener_detalle_regla(_params: ParamsObtenerDetalleRegla): Promise<unknown> {
  throw new ErrorNoImplementada("obtener_detalle_regla");
}

export async function obtener_resultados_reglas(_params: ParamsObtenerResultadosReglas): Promise<unknown> {
  throw new ErrorNoImplementada("obtener_resultados_reglas");
}

export async function obtener_evidencia(_params: ParamsObtenerEvidencia): Promise<unknown> {
  throw new ErrorNoImplementada("obtener_evidencia");
}

export async function obtener_contexto_pago(_params: ParamsObtenerContextoPago): Promise<unknown> {
  throw new ErrorNoImplementada("obtener_contexto_pago");
}
