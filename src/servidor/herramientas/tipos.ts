import { z } from "zod";
import { EsquemaReglaId } from "../../contratos/informe-evidencias.schema.js";

const textoId = z.string().trim().min(1);

// strict(): si el modelo manda params de más, se rechazan
export const EsquemaParamsObtenerEjecucion = z.object({ ejecucion_id: textoId }).strict();
export const EsquemaParamsObtenerDetalleRegla = z.object({ regla_id: EsquemaReglaId }).strict();
export const EsquemaParamsObtenerResultadosReglas = z.object({ ejecucion_id: textoId }).strict();
export const EsquemaParamsObtenerEvidencia = z
  .object({ ejecucion_id: textoId, ref_evidencia: textoId })
  .strict();
export const EsquemaParamsObtenerContextoPago = z.object({ ejecucion_id: textoId }).strict();

export type ReglaId = z.infer<typeof EsquemaReglaId>;
export type Decision = "PERMITIR" | "BLOQUEAR";
export type EstadoInvestigacion =
  | "NO_INICIADA"
  | "PENDIENTE"
  | "EN_CURSO"
  | "COMPLETADA"
  | "PARCIAL"
  | "FALLIDA";

// Los nombres siguen contratos-api.md y base-datos.md; los importes van en centavos

export type RegistroEjecucion = {
  ejecucion_id: string;
  decision: Decision;
  estado_ejecucion: "PERSISTIDA";
  estado_investigacion: EstadoInvestigacion;
  version_motor: string;
  version_politica: string;
  creado_en: string; // ISO 8601
};

export type RegistroResultadoRegla = {
  regla_id: ReglaId;
  estado: "CUMPLE" | "NO_CUMPLE" | "INDETERMINADO";
  observado: Record<string, unknown>;
  esperado: Record<string, unknown>;
  mensaje: string | null;
  severidad: "BLOQUEANTE" | "INFORMATIVA";
  refs_evidencia: string[];
};

export type RegistroEvidencia = {
  ref_evidencia: string;
  tipo_evidencia: string;
  origen: string;
  contenido: Record<string, unknown>;
};

export type RegistroContextoPago = {
  pago_id: string;
  monto_centavos: number;
  moneda: "MXN";
  categoria: string;
  solicitante_id: string;
  presupuesto_id: string;
  presupuesto_disponible_centavos: number | null;
  // null = el contexto confiable no tiene registro; eso NO cuenta como aprobado
  autorizacion_verificada: {
    estado_aprobacion: string | null;
    aprobador_id: string | null;
  } | null;
};

export type RegistroDetalleRegla = {
  regla_id: ReglaId;
  version_politica: string;
  habilitada: boolean;
  configuracion: Record<string, unknown>;
};

// Lo que implementa Dev 1 en persistencia. Solo lectura.
// - No existe el registro -> devuelve null (no throw)
// - Falla de verdad (BD caída, timeout) -> throw; la herramienta lo vuelve DEPENDENCIA_NO_DISPONIBLE
// - obtenerResultadosReglas devuelve siempre las 5 reglas en orden PAG-001..005
// - obtenerEvidencia devuelve null si la ref_evidencia es de otra ejecución
export interface FuenteDatosHerramientas {
  obtenerEjecucion(ejecucionId: string): Promise<RegistroEjecucion | null>;
  obtenerResultadosReglas(ejecucionId: string): Promise<RegistroResultadoRegla[] | null>;
  obtenerEvidencia(ejecucionId: string, refEvidencia: string): Promise<RegistroEvidencia | null>;
  obtenerContextoPago(ejecucionId: string): Promise<RegistroContextoPago | null>;
  obtenerDetalleRegla(reglaId: ReglaId): Promise<RegistroDetalleRegla | null>;
}

// Códigos del catálogo cerrado de catalogo-errores.md; no se agregan nuevos
export type CodigoErrorHerramienta =
  | "ERROR_VALIDACION"
  | "EJECUCION_NO_ENCONTRADA"
  | "REFERENCIA_EVIDENCIA_INVALIDA"
  | "DEPENDENCIA_NO_DISPONIBLE";

export type ResultadoHerramienta<T> =
  | { ok: true; datos: T }
  | { ok: false; error: { codigo: CodigoErrorHerramienta; mensaje: string } };

export type HerramientasLectura = {
  obtener_ejecucion(params: unknown): Promise<ResultadoHerramienta<RegistroEjecucion>>;
  obtener_detalle_regla(params: unknown): Promise<ResultadoHerramienta<RegistroDetalleRegla>>;
  obtener_resultados_reglas(params: unknown): Promise<ResultadoHerramienta<RegistroResultadoRegla[]>>;
  obtener_evidencia(params: unknown): Promise<ResultadoHerramienta<RegistroEvidencia>>;
  obtener_contexto_pago(params: unknown): Promise<ResultadoHerramienta<RegistroContextoPago>>;
};
