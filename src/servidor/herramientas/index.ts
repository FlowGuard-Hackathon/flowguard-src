import type { ZodType } from "zod";
import { mensajes } from "../../mensajes/index.js";
import {
  EsquemaParamsObtenerContextoPago,
  EsquemaParamsObtenerDetalleRegla,
  EsquemaParamsObtenerEjecucion,
  EsquemaParamsObtenerEvidencia,
  EsquemaParamsObtenerResultadosReglas,
  type CodigoErrorHerramienta,
  type FuenteDatosHerramientas,
  type HerramientasLectura,
  type ResultadoHerramienta,
} from "./tipos.js";

export * from "./tipos.js";
export { FuenteDatosEnMemoria } from "./fuenteDatosEnMemoria.js";
export { SEMILLA_SIMULADA } from "./datosSimulados.js";

const errores = mensajes.herramientas.errores;

function fallo(codigo: CodigoErrorHerramienta, mensaje: string): ResultadoHerramienta<never> {
  return { ok: false, error: { codigo, mensaje } };
}

// Cualquier throw de la fuente sale como DEPENDENCIA_NO_DISPONIBLE genérico:
// ni SQL ni stack traces hacia el modelo
async function ejecutar<P, T>(
  esquema: ZodType<P>,
  paramsCrudos: unknown,
  consulta: (params: P) => Promise<ResultadoHerramienta<T>>,
): Promise<ResultadoHerramienta<T>> {
  const parseado = esquema.safeParse(paramsCrudos);
  if (!parseado.success) {
    const campos = [...new Set(parseado.error.issues.map((i) => i.path.join(".") || "(raíz)"))];
    return fallo("ERROR_VALIDACION", errores.parametrosInvalidos(campos.join(", ")));
  }
  try {
    return await consulta(parseado.data);
  } catch {
    return fallo("DEPENDENCIA_NO_DISPONIBLE", errores.accesoDatosNoDisponible);
  }
}

export function crearHerramientasLectura(fuente: FuenteDatosHerramientas): HerramientasLectura {
  return {
    obtener_ejecucion: (params) =>
      ejecutar(EsquemaParamsObtenerEjecucion, params, async ({ ejecucion_id }) => {
        const registro = await fuente.obtenerEjecucion(ejecucion_id);
        return registro
          ? { ok: true, datos: registro }
          : fallo("EJECUCION_NO_ENCONTRADA", errores.ejecucionNoExiste);
      }),

    obtener_resultados_reglas: (params) =>
      ejecutar(EsquemaParamsObtenerResultadosReglas, params, async ({ ejecucion_id }) => {
        const registros = await fuente.obtenerResultadosReglas(ejecucion_id);
        return registros
          ? { ok: true, datos: registros }
          : fallo("EJECUCION_NO_ENCONTRADA", errores.ejecucionNoExiste);
      }),

    obtener_evidencia: (params) =>
      ejecutar(EsquemaParamsObtenerEvidencia, params, async ({ ejecucion_id, ref_evidencia }) => {
        const ejecucion = await fuente.obtenerEjecucion(ejecucion_id);
        if (!ejecucion) return fallo("EJECUCION_NO_ENCONTRADA", errores.ejecucionNoExiste);
        const registro = await fuente.obtenerEvidencia(ejecucion_id, ref_evidencia);
        return registro
          ? { ok: true, datos: registro }
          : fallo("REFERENCIA_EVIDENCIA_INVALIDA", errores.evidenciaNoExiste);
      }),

    obtener_contexto_pago: (params) =>
      ejecutar(EsquemaParamsObtenerContextoPago, params, async ({ ejecucion_id }) => {
        const registro = await fuente.obtenerContextoPago(ejecucion_id);
        return registro
          ? { ok: true, datos: registro }
          : fallo("EJECUCION_NO_ENCONTRADA", errores.ejecucionNoExiste);
      }),

    obtener_detalle_regla: (params) =>
      ejecutar(EsquemaParamsObtenerDetalleRegla, params, async ({ regla_id }) => {
        const registro = await fuente.obtenerDetalleRegla(regla_id);
        // el catálogo no tiene código para "regla sin configuración"; este es el más cercano
        return registro
          ? { ok: true, datos: registro }
          : fallo("REFERENCIA_EVIDENCIA_INVALIDA", errores.reglaSinConfiguracion);
      }),
  };
}
